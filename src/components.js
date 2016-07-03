/* eslint-disable react/no-multi-comp */
import { saveAs } from 'filesaverjs';
import Leaflet from 'leaflet';
import AppBar from 'material-ui/AppBar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import { List, ListItem } from 'material-ui/List';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Snackbar from 'material-ui/Snackbar';
import TextField from 'material-ui/TextField';
import React from 'react';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import { hashHistory } from 'react-router';

import { addPoint, deletePoint, movePoint, labelPoint, normalizePoint } from './actions';

const history = hashHistory;

const buildGeoJSON = (points) => ({
  type: 'FeatureCollection',
  features: points.map((p) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [p.location[1], p.location[0]],
    },
    properties: {
      label: p.label,
    },
  })),
});

export class LabelPointDialog extends React.Component {

  static propTypes = {
    dispatch: React.PropTypes.func,
    params: React.PropTypes.shape({
      index: React.PropTypesstring,
    }),
    points: React.PropTypes.arrayOf(React.PropTypes.shape({
      label: React.PropTypes.string,
      location: React.PropTypes.arrayOf(React.PropTypes.number),
    })),
  };

  constructor(props) {
    super(props);

    this.onCancel = this.onCancel.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  state = {
    labelValue: this.props.points[parseInt(this.props.params.index, 10)].label,
  };

  componentDidMount() {
    this.refs.textField.focus();
  }

  onCancel() {
    history.push('/');
  }

  onSubmit() {
    this.props.dispatch(labelPoint(parseInt(this.props.params.index, 10), this.state.labelValue));
    history.push('/');
  }

  render() {
    const dialogActions = [
      <FlatButton
        key="cancel"
        label="Cancel"
        onTouchTap={this.onCancel}
        secondary
      />,
      <FlatButton
        key="submit"
        label={"Edit"}
        onTouchTap={this.onSubmit}
        primary
      />,
    ];

    return (
      <Dialog
        actions={dialogActions}
        onRequestClose={null}
        open
        title={"Edit Point Label"}
      >
        <TextField
          errorStyle={{ color: 'red' }}
          errorText={this.state.labelValue.length > 0 ? null : 'Required'}
          floatingLabelText="Point Label"
          onChange={(e) => {
            this.setState({ labelValue: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              this.onSubmit(e);
            }
          }}
          ref="textField"
          value={this.state.labelValue}
        />
      </Dialog>);
  }
}

export const PlacePointMessage = () => (
  <Snackbar
    action="Cancel"
    message="Click the map to place a point"
    onActionTouchTap={() => history.push('/')}
    // Empty function necessary to prevent call to deprecated dismiss method
    onRequestClose={() => {}}
    open
  />
);

export class App extends React.Component {

  static propTypes = {
    children: React.PropTypes.node,
    dispatch: React.PropTypes.func,
    location: React.PropTypes.shape({
      pathname: React.PropTypes.string,
    }),
    points: React.PropTypes.arrayOf(React.PropTypes.shape({
      label: React.PropTypes.string,
      location: React.PropTypes.arrayOf(React.PropTypes.number),
    })),
  };

  constructor(props) {
    super(props);

    this.onSavePointsToFile = this.onSavePointsToFile.bind(this);
    this.renderMarker = this.renderMarker.bind(this);
  }

  state = {
    errorMessage: null,
  };

  componentDidMount() {
    this.setMapView([34.676684, -82.838031], 12);
  }

  onSavePointsToFile() {
    const pointsBlob = new Blob(
      [JSON.stringify(buildGeoJSON(this.state.points))],
      { type: 'application/json' },
    );
    saveAs(pointsBlob, 'points.json');
  }

  setMapView(point, zoomLevel = 12) {
    const p = normalizePoint(point);
    this.refs.map.leafletElement.setView(Leaflet.latLng(p[0], p[1]), zoomLevel, { animate: true });
  }

  renderHeader() {
    const addPointButton = (
      <IconButton
        iconClassName="material-icons"
        onTouchTap={() => history.push('/new')}
        iconStyle={{ color: '#fff' }}
        tooltip="Add New Point"
        tooltipPosition="bottom-left"
      >add_circle</IconButton>
    );

    const menuButton = (
      <IconButton
        iconClassName="material-icons"
        iconStyle={{ color: '#fff' }}
        tooltip="More"
        tooltipPosition="bottom-left"
      >more_vert</IconButton>
    );

    const menu = (
      <IconMenu
        iconButtonElement={menuButton}
        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem
          onTouchTap={() => this.refs.map.leafletElement.locate()}
          primaryText="Locate"
        />
        <MenuItem
          onTouchTap={this.onSavePointsToFile}
          primaryText="Export Points"
        />
      </IconMenu>
    );

    return (
      <AppBar
        title="Point Editor"
        iconElementRight={<span>{addPointButton}{menu}</span>}
        showMenuIconButton={false}
      />
    );
  }

  renderMap() {
    return (
      <Map
        onClick={(e) => {
          if (this.props.location.pathname === '/new') {
            this.props.dispatch(addPoint(e.latlng));
            history.push('/');
          }
        }}
        onLocationerror={() => this.setState({ errorMessage: 'Unable to locate' })}
        onLocationfound={(e) => this.setMapView(e.latlng, 16)}
        ref="map"
        style={{ height: '100%' }}
      >
        <TileLayer
          attribution="&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors"
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        />
        {this.props.points.map(this.renderMarker)}
      </Map>
    );
  }

  renderMarker(point, index) {
    return (
      <Marker
        draggable
        key={index}
        ondragend={(e) => {
          this.props.dispatch(movePoint(index, e.target.getLatLng()));
        }}
        position={point.location}
      >
        <Popup><span>{point.label}</span></Popup>
      </Marker>
    );
  }

  renderPointsList() {
    return (
      <List subheader={this.props.points.length === 0 ? 'No points' : null}>
      {this.props.points.map((p, i) => {
        const editLabelButton = (
          <IconButton
            iconClassName="material-icons"
            onTouchTap={() => history.push(`/edit/${i}`)}
            tooltip="Edit Label"
            tooltipPosition="bottom-left"
          >edit</IconButton>
        );

        const deletePointButton = (
          <IconButton
            iconClassName="material-icons"
            onTouchTap={() => this.props.dispatch(deletePoint(i))}
            tooltip="Delete Point"
            tooltipPosition="bottom-left"
          >remove_circle</IconButton>
        );

        return (
          <ListItem
            key={i}
            onTouchTap={() => this.setMapView(p.location, 16)}
            primaryText={p.label}
            rightIconButton={<span>{editLabelButton}{deletePointButton}</span>}
            secondaryText={`${p.location[0].toFixed(4)}, ${p.location[1].toFixed(4)}`}
          />
        );
      })}
      </List>
    );
  }

  renderErrorSnackbar() {
    if (this.state.errorMessage) {
      return (
        <Snackbar
          action="Dismiss"
          autoHideDuration={2000}
          message={this.state.errorMessage || ''}
          onActionTouchTap={() => {
            this.setState({ errorMessage: null });
          }}
          onRequestClose={(reason) => {
            if (reason === 'timeout') {
              this.setState({ errorMessage: null });
            }
          }}
          open
        />
      );
    }
    return null;
  }

  render() {
    return (
      <MuiThemeProvider>
        <div style={{ height: '100%' }}>
          {this.renderHeader()}

          <div style={{ height: 'calc(100% - 64px)' }}>
            <div
              style={{
                float: 'left',
                height: '100%',
                width: 'calc(100% - 301px)',
              }}
            >
            {this.renderMap()}
            </div>
            <div
              style={{
                borderLeft: '1px solid #ddd',
                float: 'left',
                height: '100%',
                width: '300px',
              }}
            >
            {this.renderPointsList()}
            </div>
          </div>
          {this.renderErrorSnackbar()}
          {this.props.children}
        </div>
      </MuiThemeProvider>
    );
  }

}
