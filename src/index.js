import "babel-polyfill";
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
import ReactDOM from "react-dom";
import {Map, Marker, Popup, TileLayer} from "react-leaflet";
import injectTapEventPlugin from 'react-tap-event-plugin';

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

const BROWSING_MAP = "BROWSING_MAP";
const PLACING_NEW_POINT = "PLACING_NEW_POINT";
const LABELING_NEW_POINT = "LABELING_NEW_POINT";

class App extends React.Component {

    state = {
        action: BROWSING_MAP,
        errorMessage: null,
        mapCenterPoint: [34.676684, -82.838031],
        mapZoom: 12,
        newPointLabel: "",
        newPointLocation: null,
        points: []
    };

    componentDidMount() {
        try {
            var savedPoints = window.localStorage.getItem("points");
            if (savedPoints) {
                this.setState({ points: JSON.parse(savedPoints) });
            }
        } catch (e) {
            this.setState({ errorMessage: "Unable to load points" });
        }
    }

    onStartAddNewPoint() {
        this.setState({ action: PLACING_NEW_POINT });
    }

    onClickMap(e) {
        if (this.state.action === PLACING_NEW_POINT) {
            this.setState({
                action: LABELING_NEW_POINT,
                newPointLocation: [e.latlng.lat, e.latlng.lng]
            });
        }
    }

    onCancelAddPoint() {
        this.setState({
            action: BROWSING_MAP,
            newPointLabel: "",
            newPointLocation: null
        });
    }

    onChangeNewPointLabel(e) {
        this.setState({ newPointLabel: e.target.value });
    }

    onSubmitNewPoint() {
        var newPoint = {
            label: this.state.newPointLabel,
            location: this.state.newPointLocation
        };
        var points = this.state.points.concat([newPoint])
        this.setState({
            action: BROWSING_MAP,
            newPointLabel: "",
            newPointLocation: null,
            points: points
        });
        window.localStorage.setItem("points", JSON.stringify(points));
    }

    onRemovePoint(pointIndex) {
        var points = this.state.points.slice(0, pointIndex).concat(this.state.points.slice(pointIndex + 1))
        this.setState({ points: points });
        window.localStorage.setItem("points", JSON.stringify(points));
    }

    onRequestLocate() {
        this.refs.map.leafletElement.locate();
    }

    onLocationError() {
        this.setState({ errorMessage: "Unable to locate" });
    }

    onLocationFound(e) {
        this.setState({
            mapCenterPoint: [e.latlng.lat, e.latlng.lng],
            mapZoom: 16
        });
    }

    onPointMoved(pointIndex, newLatLng) {
        var movedPoint = this.state.points[pointIndex];
        movedPoint.location = newLatLng;
        var points = this.state.points.slice(0, pointIndex).concat(movedPoint).concat(this.state.points.slice(pointIndex + 1))
        this.setState({ points: points });
        window.localStorage.setItem("points", JSON.stringify(points));
    }

    onSavePointsToFile() {
        var pointsBlob = new Blob([JSON.stringify(buildGeoJSON(this.state.points))], { type: "application/json" });
        saveAs(pointsBlob, "points.json");
    }

    updateStateFromMap() {
        const map = this.refs.map.getLeafletElement();
        const center = [map.getCenter().lat, map.getCenter().lng];
        this.setState({ mapCenterPoint: center, mapZoom: map.getZoom() });
    }

    renderHeader() {
        return (<AppBar title="Point Editor"
            iconElementRight={<span>

                <IconButton
                    iconClassName="material-icons"
                    onTouchTap={this.onStartAddNewPoint.bind(this)}
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
                        onTouchTap={this.onRequestLocate.bind(this)}
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
            center={this.state.mapCenterPoint}
            onClick={this.onClickMap.bind(this)}
            onLocationerror={this.onLocationError.bind(this)}
            onLocationfound={this.onLocationFound.bind(this)}
            onDrag={this.updateStateFromMap.bind(this)}
            onDragEnd={this.updateStateFromMap.bind(this)}
            onZoomEnd={this.updateStateFromMap.bind(this)}
            ref="map"
            style={{height:"100%"}}
            zoom={this.state.mapZoom}>
            <TileLayer
                attribution="&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors"
                url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"/>

            {this.state.points.map(this.renderMarker.bind(this))}

        </Map>);
    }

    renderMarker(point, index) {
        return <Marker
            draggable={true}
            key={index}
            ondragend={(e) => {
                var dropLatLng = e.target.getLatLng();
                this.onPointMoved(index, [dropLatLng.lat, dropLatLng.lng]);
            }}
            position={point.location}>
            <Popup><span>{point.label}</span></Popup>
        </Marker>;
    }

    renderPointsList() {
        return (<List>
            {this.state.points.map((p, i) => {
                return <ListItem
                    key={i}
                    onTouchTap={(e) => {
                        this.refs.map.leafletElement.setView(Leaflet.latLng(p.location[0], p.location[1]), 14, { animate: true });
                    }}
                    primaryText={p.label}
                    rightIconButton={<IconButton
                        iconClassName="material-icons"
                        onTouchTap={() => { this.onRemovePoint(i); }}
                        tooltip="Remove Point"
                        tooltipPosition="bottom-left">remove_circle</IconButton>}
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

    renderPlacingNewPointSnackbar() {
        if (this.state.action === PLACING_NEW_POINT) {
            return (<Snackbar
                action="Cancel"
                message="Click the map to place a point"
                onActionTouchTap={this.onCancelAddPoint.bind(this)}
                onRequestClose={() => {}} // Empty function necessary to prevent call to deprecated dismiss method
                open={true}/>);
        } else {
            return null;
        }
    }

    renderLabelingNewPointDialog() {
        if (this.state.action === LABELING_NEW_POINT) {
            return (<Dialog
                actions={[
                    <FlatButton
                        key="cancel"
                        label="Cancel"
                        onTouchTap={this.onCancelAddPoint.bind(this)}
                        secondary={true}/>,
                    <FlatButton
                        key="submit"
                        label="Add"
                        onTouchTap={this.onSubmitNewPoint.bind(this)}
                        primary={true}/>
                ]}
                onRequestClose={null}
                open={this.state.action === LABELING_NEW_POINT}
                title="New Point">
                <TextField
                    errorStyle={{color:"red"}}
                    errorText={this.state.newPointLabel.length > 0 ? null : "Required"}
                    floatingLabelText="Point Label"
                    onChange={this.onChangeNewPointLabel.bind(this)}
                    onEnterKeyDown={this.onSubmitNewPoint.bind(this)}/>
            </Dialog>);
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
            {this.renderPlacingNewPointSnackbar()}
            {this.renderLabelingNewPointDialog()}

        </div>);
    }

}

injectTapEventPlugin();

ReactDOM.render(<App/>, document.getElementById("app-container"));
console.log(saveAs);
