import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import ReactRotatingText from "react-rotating-text";
import styles from "./styles/App.css";
import moment from "moment";
import MDSpinner from "react-md-spinner";
import { distanceToDegrees, distanceToRadians } from "@turf/helpers";
const DEGREE_LAT_IN_KM = 111.2;
const TOTAL_EARTH_DISTANCE_KM = 40075;

require("es6-promise").polyfill();
require("isomorphic-fetch");

let viewer;
const step = 40075 / 4;
const arcs = [[0, 0], [90, step], [180, 2 * step], [270, 3 * step]];

class App extends Component {
  constructor() {
    super();

    this.state = {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      data: {
        earth_circumference_m: 40075000,
        edit_url: null,
        movements_latest: [],
        movements_user: [],
        person: null,
        total_distance_m: null,
        total_distance_km: null
      }
    };
    this.initTableTop = this.initTableTop.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", () => {
      this.setState({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      });
    });
    window.addEventListener("DOMContentLoaded", this.initTableTop);

    const mapbox = new Cesium.MapboxImageryProvider({
      mapId: "mapbox.satellite",
      accessToken: "pk.eyJ1IjoibmVsZW5zY2h1dXJtYW5zIiwiYSI6ImhkXzhTdXcifQ.3k2-KAxQdyl5bILh_FioCw"
    });

    const center = Cesium.Cartesian3.fromDegrees(0, 0, 6000000);
    viewer = new Cesium.Viewer("cesiumContainer", {
      imageryProvider: mapbox,
      timeline: false,
      infobox: false,
      baseLayerPicker: false
    });
    viewer.camera.setView({
      destination: center
    });

    const terrainProvider = new Cesium.CesiumTerrainProvider({
      url: "https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles",
      requestWaterMask: true,
      requestVertexNormals: true
    });
    viewer.terrainProvider = terrainProvider;
    viewer.scene.globe.enableLighting = true;

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0),
      label: {
        text: "Start/finish",
        font: "24px Helvetica",
        fillColor: Cesium.Color.SKYBLUE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      }
    });

    // Hide clock widget
    document.getElementsByClassName(
      "cesium-viewer-animationContainer"
    )[0].style.visibility =
      "hidden";
    document.getElementsByClassName(
      "cesium-viewer-toolbar"
    )[0].style.visibility =
      "hidden";
    viewer.forceResize();
  }

  initTableTop() {
    fetch("/api").then(response => response.json()).then(data => {
      this.setState(
        {
          data: data
        },
        () => {
          function drawArc(fromDegrees, toDegrees) {
            if (fromDegrees >= 180) fromDegrees -= 360;
            if (toDegrees >= 180) toDegrees -= 360;

            var arc = {
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray([
                  fromDegrees,
                  0,
                  toDegrees,
                  0
                ]),
                width: 5,
                material: Cesium.Color.WHITE
              }
            };
            viewer.entities.add(arc);
          }

          arcs.forEach((element, i) => {
            let degrees = element[0];
            let start = element[1];

            // Dist is between 0 and 1, part of this arc to draw
            let dist = (this.state.data.total_distance_km - start) / step;
            if (dist <= 0) return;
            if (dist > 1) dist = 1;

            drawArc(degrees, degrees + dist * 90);
          });

          function fromToAnimation(adjustPitch) {
            var camera = viewer.scene.camera;

            var fromOptions = {
              destination: Cesium.Cartesian3.fromDegrees(0, 0, 2000000.0),
              duration: 5,
              orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90),
                roll: 0.0
              }
            };

            var toOptions = {
              destination: Cesium.Cartesian3.fromDegrees(185, 0, 1500000.0),
              orientation: {
                // heading : Cesium.Math.toRadians(45.0),
                // pitch : Cesium.Math.toRadians(-70),
                roll: 0.0
              },
              duration: 7
              // flyOverLongitude: Cesium.Math.toRadians(200000.0)
            };

            fromOptions.complete = function() {
              setTimeout(function() {
                camera.flyTo(toOptions);
              }, 1000);
            };

            if (adjustPitch) {
              toOptions.pitchAdjustHeight = 1000;
              fromOptions.pitchAdjustHeight = 1000;
            }

            camera.flyTo(fromOptions);
          }

          // setTimeout(function() {
          //   fromToAnimation();
          // }, 2000);

          // function icrf(scene, time) {
          //     if (scene.mode !== Cesium.SceneMode.SCENE3D) {
          //         return;
          //     }
          //     var icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
          //     if (Cesium.defined(icrfToFixed)) {
          //         var camera = viewer.camera;
          //         var offset = Cesium.Cartesian3.clone(camera.position);
          //         var transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
          //         camera.lookAtTransform(transform, offset);
          //     }
          // }
          //
          //
          // const clock = viewer.clock;
          // const scene = viewer.scene;
          // setTimeout(function() {
          //   clock.multiplier = 3 * 60 * 10 * -1;
          //   scene.preRender.addEventListener(icrf);
          // }, 2000);

          function spinGlobe(dynamicRate) {
            var previousTime = Date.now();

            viewer.scene.postRender.addEventListener(function(scene, time) {
              var spinRate = dynamicRate;
              var currentTime = Date.now();
              var delta = (currentTime - previousTime) / 1000;
              previousTime = currentTime;
              viewer.scene.camera.rotate(
                Cesium.Cartesian3.UNIT_Z,
                -spinRate * delta
              );
            });
          }

          spinGlobe(0.0008);
        }
      );
    });
  }
  render() {
    const { data } = this.state;
    const total = data.total_distance_km;
    const toGo = data.earth_circumference_m / 1000 - total;

    return (
      <div className={styles.App}>
        <div
          id="title"
          style={{ position: "absolute", zIndex: 9999, top: 0, left: 0, paddingLeft: 20 }}
        >
          <h2>Reis om de wereld in 80 dagen</h2>
          <a href="/booking/" className={styles.AddButton}>
            Afstand loggen
          </a><br />
          {data.length === 0 ? <MDSpinner /> : null}

          {total === null
            ? null
            : <div
                style={{
                  lineHeight: "35px",
                  paddingTop: 20
                }}
              >
                <ReactRotatingText
                  items={[
                    "Totaal: " + Math.round(total) + " km afgelegd",
                    "Nog: " + Math.round(toGo) + " kilometer te gaan",
                    "Aankomst: " +
                      moment("20170928", "YYYYMMDD").locale("nl").fromNow()
                  ]}
                />
              </div>}
        </div>
        <div id="cesiumContainer" ref="cesiumRoot" />
      </div>
    );
  }
}

export default App;
