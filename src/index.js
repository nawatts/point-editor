import "babel-polyfill";
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

class App extends React.Component {

    state = {
        mapCenterPoint: [34.676684, -82.838031],
        mapZoom: 12,
        newPointLabel: "",
        newPointLocation: null,
        points: [],
        labelingNewPoint: false,
        placingNewPoint: false
    };

    onStartAddNewPoint() {
        this.setState({ placingNewPoint: true });
    }

    onClickMap(e) {
        if (this.state.placingNewPoint) {
            this.setState({
                newPointLocation: [e.latlng.lat, e.latlng.lng],
                labelingNewPoint: true,
                placingNewPoint: false,
            });
        }
    }

    onCancelAddPoint() {
        this.setState({
            newPointLabel: "",
            newPointLocation: null,
            labelingNewPoint: false,
            placingNewPoint: false
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
        this.setState({
            newPointLabel: "",
            newPointLocation: null,
            points: this.state.points.concat([newPoint]),
            labelingNewPoint: false,
            placingNewPoint: false,
        });
    }

    onRemovePoint(pointIndex) {
        var points = this.state.points;
        this.setState({ points: points.slice(0, pointIndex).concat(points.slice(pointIndex + 1)) });
    }

    onRequestLocate() {
        this.refs.map.leafletElement.locate();
    }

    onLocationError() {

    }

    onLocationFound(e) {
        this.setState({
            mapCenterPoint: [e.latlng.lat, e.latlng.lng],
            mapZoom: 16
        });
    }

    onPointMoved(pointIndex, newLatLng) {
        var points = this.state.points;
        var movedPoint = points[pointIndex];
        movedPoint.location = newLatLng;
        this.setState({
            points: points.slice(0, pointIndex).concat(movedPoint).concat(points.slice(pointIndex + 1))
        });
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

    render() {
        return (<div style={{height:"100%"}}>
            <AppBar title="Point Editor"
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
                    </IconMenu>

                    </span>}
                showMenuIconButton={false}></AppBar>

            <div style={{height: "calc(100% - 64px)"}}>

                <div style={{float:"left", height:"100%", width:"calc(100% - 301px)"}}>

                    <Map
                        center={this.state.mapCenterPoint}
                        onClick={this.onClickMap.bind(this)}
                        onLocationerror={this.onLocationError.bind(this)}
                        onLocationfound={this.onLocationFound.bind(this)}
                        ref="map"
                        style={{height:"100%"}}
                        zoom={this.state.mapZoom}>
                        <TileLayer
                            attribution="&copy; <a href='http://osm.org/copyright'OpenStreetMap</a> contributors"
                            url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"/>

                        {this.state.points.map(this.renderMarker.bind(this))}

                    </Map>

                </div>

                <div style={{borderLeft: "1px solid #ddd", float:"left", height:"100%", width:"300px"}}>
                    <List>
                        {this.state.points.map((p, i) => {
                            return <ListItem
                                key={i}
                                primaryText={p.label}
                                rightIconButton={<IconButton
                                    iconClassName="material-icons"
                                    onTouchTap={() => { this.onRemovePoint(i); }}
                                    tooltip="Remove Point"
                                    tooltipPosition="bottom-left">remove_circle</IconButton>}
                                secondaryText={`${p.location[0].toFixed(4)}, ${p.location[1].toFixed(4)}`}/>;
                        })}
                    </List>
                </div>

            </div>

            <Snackbar
                action="Cancel"
                message="Click the map to place a point"
                onActionTouchTap={this.onCancelAddPoint.bind(this)}
                onRequestClose={() => {}} // Empty function necessary to prevent call to deprecated dismiss method
                open={this.state.placingNewPoint}/>

            <Dialog
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
                open={this.state.labelingNewPoint}
                title="New Point">
                <TextField
                    errorStyle={{color:"red"}}
                    errorText={this.state.newPointLabel.length > 0 ? null : "Required"}
                    floatingLabelText="Point Label"
                    onChange={this.onChangeNewPointLabel.bind(this)}
                    onEnterKeyDown={this.onSubmitNewPoint.bind(this)}/>
            </Dialog>

        </div>);
    }

}

injectTapEventPlugin();

ReactDOM.render(<App/>, document.getElementById("app-container"));
