import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import {connect, Provider} from "react-redux";
import {hashHistory, Route, Router} from "react-router";
import injectTapEventPlugin from "react-tap-event-plugin";
import {applyMiddleware, combineReducers, compose, createStore} from "redux";
import persistState from "redux-localstorage";

import {App, PlacePointMessage, LabelPointDialog} from "./components";
import {pointsReducer} from "./reducers";

injectTapEventPlugin();

const store = createStore(
    combineReducers({ points: pointsReducer }),
    compose(
        persistState("points"),
        window.devToolsExtension ? window.devToolsExtension() : (f) => f
    )
);

const ConnectedApp = connect(state => state)(App);
const ConnectedPlacePointMessage = connect(({ dispatch }) => { return { dispatch }; })(PlacePointMessage);
const ConnectedLabelPointDialog = connect(({ dispatch, points }) => { return { dispatch, points }; })(LabelPointDialog);

ReactDOM.render(
    <Provider store={store}>
        <Router history={hashHistory}>
            <Route path="/" component={ConnectedApp}>
                <Route path="new" component={ConnectedPlacePointMessage}/>
                <Route path="edit/:index" component={ConnectedLabelPointDialog}/>
            </Route>
        </Router>
    </Provider>,
    document.getElementById("app-container")
);
