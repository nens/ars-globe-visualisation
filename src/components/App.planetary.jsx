import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { Scrollbars } from "react-custom-scrollbars";
import ReactRotatingText from "react-rotating-text";
import styles from "./styles/App.css";
import Ruler from "./svg/Ruler.svg";
import moment from "moment";
import MDSpinner from "react-md-spinner";
import { distanceToDegrees, distanceToRadians } from "@turf/helpers";
const DEGREE_LAT_IN_KM = 111.2;
const TOTAL_EARTH_DISTANCE_KM = 40075;

require('es6-promise').polyfill();
require('isomorphic-fetch');

const planet = planetaryjs.planet();

function autorotate(degPerSec) {
  return function(planet) {
    let lastTick = null;
    let paused = false;
    planet.plugins.autorotate = {
      pause: function() {
        paused = true;
      },
      resume: function() {
        paused = false;
      }
    };
    planet.onDraw(function() {
      if (paused || !lastTick) {
        lastTick = new Date();
      } else {
        let now = new Date();
        let delta = now - lastTick;
        // This plugin uses the built-in projection (provided by D3)
        // to rotate the globe each time we draw it.
        let rotation = planet.projection.rotate();
        rotation[0] -= degPerSec * delta / 1000;
        if (rotation[0] >= 180) rotation[0] -= 360;
        planet.projection.rotate(rotation);
        lastTick = now;
      }
    });
  };
}

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
    this.drawPlanet = this.drawPlanet.bind(this);
  }
  componentDidMount() {
    window.addEventListener("resize", () => {
      this.setState({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      });
    });
    window.addEventListener("DOMContentLoaded", this.initTableTop);
  }

  drawPlanet() {
    const { data } = this.state;
    const total = data.total_distance_km;

    planet.loadPlugin(autorotate(10));

    if (document.location.href.indexOf("localhost:3000") > 0) {
      console.log("On localhost:3000, get world-110m.json from /");
      planet.loadPlugin(
        planetaryjs.plugins.earth({
          topojson: { file: "world-110m.json" },
          oceans: { fill: "#001320" },
          land: { fill: "#06304e" },
          borders: { stroke: "#001320" }
        })
      );
    } else {
      console.log(
        "Not on localhost:3000, getting world-110m.json from /static_media/"
      );
      planet.loadPlugin(
        planetaryjs.plugins.earth({
          topojson: { file: "/static_media/world-110m.json" },
          oceans: { fill: "#001320" },
          land: { fill: "#06304e" },
          borders: { stroke: "#001320" }
        })
      );
    }

    planet.projection.scale(175).translate([175, 175]).rotate([0, -10, 0]);

    planet.loadPlugin(
      planetaryjs.plugins.drag({
        onDragStart: function() {
          this.plugins.autorotate.pause();
        },
        onDragEnd: function() {
          this.plugins.autorotate.resume();
        }
      })
    );

    planet.loadPlugin(function(planet) {
      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          function drawArc(fromDegrees, toDegrees) {
            if (fromDegrees >= 180) fromDegrees -= 360;
            if (toDegrees >= 180) toDegrees -= 360;

            var arc = {
              type: "LineString",
              coordinates: [[fromDegrees, 0], [toDegrees, 0]]
            };
            context.beginPath();
            planet.path.context(context)(arc);
            context.strokeStyle = "#ffffff";
            context.lineWidth = 5;
            context.stroke();
            context.closePath();
          }

          // Divide arc into four so they don't wrap around the world the wrong way
          var step = 40075 / 4;
          var arcs = [[0, 0], [90, step], [180, 2 * step], [270, 3 * step]];

          arcs.forEach((element, i) => {
            let degrees = element[0];
            let start = element[1];

            // Dist is between 0 and 1, part of this arc to draw
            let dist = (total - start) / step;
            if (dist <= 0) return;
            if (dist > 1) dist = 1;

            drawArc(degrees, degrees + dist * 90);
          });
        });
      });
    });

    planet.projection.scale(250).translate([250, 250]);
    let canvas = document.getElementById("globe");
    planet.draw(canvas);
  }

  initTableTop() {
    fetch("/api").then(response => response.json()).then(data => {
      this.setState(
        {
          data: data
        },
        () => {
          this.drawPlanet();
        }
      );
    });
  }
  render() {
    const { data } = this.state;
    const total = data.total_distance_km;
    const toGo = data.earth_circumference_m / 1000 - total;

    console.log('total', total);


    return (
      <div className={styles.App}>
        <h2>Reis om de wereld in 80 dagen</h2>
        <a href="/booking/" className={styles.AddButton}>
          Afstand loggen
        </a>
        {data.length === 0 ? <MDSpinner /> : null}

        {(total === null)
          ? null
          : <div
              style={{
                lineHeight: "35px"
              }}
            >
              <ReactRotatingText
                items={[
                  "Totaal: " + Math.round(total) + " km afgelegd",
                  "Nog: " + Math.round(toGo) + " kilometer te gaan",
                  "Aankomst: " + moment("20170928", "YYYYMMDD").locale("nl").fromNow()
                ]}
              />
            </div>}

        <canvas
          ref="globe"
          id="globe"
          className={styles.Globe}
          width="500"
          height="500"
        />

      </div>
    );
  }
}

export default App;
