import {saveAs} from "filesaverjs";
import Leaflet from "leaflet";
import AppBar from "material-ui/lib/app-bar";
import Dialog from "material-ui/lib/dialog";
import FlatButton from "material-ui/lib/flat-button";
import IconButton from "material-ui/lib/icon-button";
import List from "material-ui/lib/lists/list";
import ListItem from "material-ui/lib/lists/list-item";
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Snackbar from "material-ui/lib/snackbar";
import TextField from "material-ui/lib/text-field";
import React from "react";
import {Map, Marker, Popup, TileLayer} from "react-leaflet";
import {hashHistory} from "react-router";

import {addPoint, deletePoint, movePoint, labelPoint, normalizePoint} from "./actions";

const history = hashHistory;

var buildGeoJSON = function(points) {
    return {
        type: "FeatureCollection",
        features: points.map((p) => {
            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [p.location[1], p.location[0]]
                },
                properties: {
                    label: p.label
                }
            };
        })
    };
};

export class LabelPointDialog extends React.Component {

    state = {
        labelValue: ""
    };

    componentDidMount() {
        this.setState({
            labelValue: this.props.points[parseInt(this.props.params.index)].label
        });

        this.refs.textField.focus();
    }

    onCancel() {
        history.push("/");
    }

    onSubmit() {
        this.props.dispatch(labelPoint(parseInt(this.props.params.index), this.state.labelValue));
        history.push("/");
    }

    render() {
        return (<Dialog
            actions={[
                <FlatButton
                    key="cancel"
                    label="Cancel"
                    onTouchTap={this.onCancel.bind(this)}
                    secondary={true}/>,
                <FlatButton
                    key="submit"
                    label={"Edit"}
                    onTouchTap={this.onSubmit.bind(this)}
                    primary={true}/>
            ]}
            onRequestClose={null}
            open={true}
            title={"Edit Point Label"}>
            <TextField
                errorStyle={{color:"red"}}
                errorText={this.state.labelValue.length > 0 ? null : "Required"}
                floatingLabelText="Point Label"
                onChange={(e) => {
                    this.setState({ labelValue: e.target.value });
                }}
                onEnterKeyDown={this.onSubmit.bind(this)}
                ref="textField"
                value={this.state.labelValue}/>
        </Dialog>);
    }
}

export const PlacePointMessage = (props) => {
    return (<Snackbar
        action="Cancel"
        message="Click the map to place a point"
        onActionTouchTap={() => history.push("/")}
        onRequestClose={() => {}} // Empty function necessary to prevent call to deprecated dismiss method
        open={true}/>);
};

export class App extends React.Component {

    state = {
        errorMessage: null
    };

    componentDidMount() {
        this.setMapView([34.676684, -82.838031], 12);
    }

    onSavePointsToFile() {
        var pointsBlob = new Blob([JSON.stringify(buildGeoJSON(this.state.points))], { type: "application/json" });
        saveAs(pointsBlob, "points.json");
    }

    setMapView(point, zoomLevel=12) {
        point = normalizePoint(point);
        this.refs.map.leafletElement.setView(Leaflet.latLng(point[0], point[1]), zoomLevel, { animate: true });
    }

    renderHeader() {
        return (<AppBar title="Point Editor"
            iconElementRight={<span>

                <IconButton
                    iconClassName="material-icons"
                    onTouchTap={() => history.push("/new")}
                    iconStyle={{color:"#fff"}}
                    tooltip="Add New Point"
                    tooltipPosition="bottom-left">add_circle</IconButton>

                <IconMenu
                    iconButtonElement={<IconButton
                        iconClassName="material-icons"
                        iconStyle={{color:"#fff"}}
                        tooltip="More"
                        tooltipPosition="bottom-left">more_vert</IconButton>}
                    targetOrigin={{horizontal:"right", vertical:"top"}}
                    anchorOrigin={{horizontal:"right", vertical:"top"}}>
                    <MenuItem
                        onTouchTap={() => this.refs.map.leafletElement.locate()}
                        primaryText="Locate"/>
                    <MenuItem
                        onTouchTap={this.onSavePointsToFile.bind(this)}
                        primaryText="Export Points"/>
                </IconMenu>

                </span>}
            showMenuIconButton={false}></AppBar>);
    }

    renderMap() {
        return (<Map
            onClick={(e) => {
                if (this.props.location.pathname === "/new") {
                    this.props.dispatch(addPoint(e.latlng));
                    history.push("/");
                }
            }}
            onLocationerror={() => this.setState({ errorMessage: "Unable to locate" })}
            onLocationfound={(e) => this.setMapView(e.latlng, 16)}
            ref="map"
            style={{height:"100%"}}>
            <TileLayer
                attribution="&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors"
                url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"/>

            {this.props.points.map(this.renderMarker.bind(this))}

        </Map>);
    }

    renderMarker(point, index) {
        return <Marker
            draggable={true}
            key={index}
            ondragend={(e) => {
                var dropLatLng = e.target.getLatLng();
                this.props.dispatch(movePoint(index, e.target.getLatLng()));
            }}
            position={point.location}>
            <Popup><span>{point.label}</span></Popup>
        </Marker>;
    }

    renderPointsList() {
        return (<List subheader={this.props.points.length === 0 ? "No points" : null}>
            {this.props.points.map((p, i) => {
                return <ListItem
                    key={i}
                    onTouchTap={() => this.setMapView(p.location, 16)}
                    primaryText={p.label}
                    rightIconButton={<span>
                        <IconButton
                            iconClassName="material-icons"
                            onTouchTap={() => history.push(`/edit/${i}`)}
                            tooltip="Edit Label"
                            tooltipPosition="bottom-left">edit</IconButton>
                        <IconButton
                            iconClassName="material-icons"
                            onTouchTap={() => this.props.dispatch(deletePoint(i))}
                            tooltip="Delete Point"
                            tooltipPosition="bottom-left">remove_circle</IconButton>
                    </span>}
                    secondaryText={`${p.location[0].toFixed(4)}, ${p.location[1].toFixed(4)}`}/>;
            })}
        </List>);
    }

    renderErrorSnackbar() {
        if (this.state.errorMessage) {
            return (<Snackbar
                action="Dismiss"
                autoHideDuration={2000}
                message={this.state.errorMessage || ""}
                onActionTouchTap={() => {
                    this.setState({ errorMessage: null });
                }}
                onRequestClose={(reason) => {
                    if (reason === "timeout") {
                        this.setState({ errorMessage: null });
                    }
                }}
                open={true}/>);
        } else {
            return null;
        }
    }

    render() {
        return (<div style={{height:"100%"}}>
            {this.renderHeader()}

            <div style={{height: "calc(100% - 64px)"}}>

                <div style={{float:"left", height:"100%", width:"calc(100% - 301px)"}}>
                    {this.renderMap()}
                </div>

                <div style={{borderLeft: "1px solid #ddd", float:"left", height:"100%", width:"300px"}}>
                    {this.renderPointsList()}
                </div>

            </div>

            {this.renderErrorSnackbar()}


            {this.props.children}

        </div>);
    }

}
