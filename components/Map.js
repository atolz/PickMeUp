import React, { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import axios from "axios";

import LocDetails from "./LocDetails";

const Map = () => {
  const ref = useRef();
  const findMeCtrlRef = useRef();
  const modeCtrlRef = useRef();
  const modeCtrlDarkRef = useRef();
  const searchRef = useRef();
  const [LngLat, setLL] = useState();
  const [AdLngLat, setAdLL] = useState();
  const [PMUMap, setPMUMap] = useState();
  const [PMUMarker, setPMUMarker] = useState();
  const [PMUInfoWin, setPMUInfoWin] = useState();
  const [theme, setTheme] = useState({ mode: "normal", mapId: "6ed6726e9c3addcc" });
  const [address, setAddress] = useState("");

  //Find Address of Location
  async function findLocationDetails(lng, lat, infowindow) {
    //1) Send google geo coding api
    const res = await axios(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCXLrz-WThV4cNntmzzW4w75L7uwqU-u14`, {
      method: "GET",
    });
    console.log("FInding my location", res.data.results[0]);
    if (res.data.results[0]) {
      console.log(res.data.results[0].formatted_address);
      const html = ReactDOMServer.renderToString(
        <LocDetails
          address={res.data.results[0].formatted_address}
          address2={res.data.results[2].formatted_address}
          lng={lng}
          lat={lat}
          locationtype={res.data.results[0].geometry.location_type}
        ></LocDetails>
      );
      infowindow.setContent(html);
    }
  }

  //Find Coord of Address
  async function findCoords(address, location, infowindow) {
    const res = await axios(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyCXLrz-WThV4cNntmzzW4w75L7uwqU-u14`, {
      method: "GET",
    });

    console.log(res.data.results[0].geometry.location);
    setAdLL({ lat: res.data.results[0].geometry.location.lat, lng: res.data.results[0].geometry.location.lng });
    console.log("Old lat lng", AdLngLat);

    if (res.data.results[0].geometry.location) {
      const html = ReactDOMServer.renderToString(<LocDetails address={location} lng={res.data.results[0].geometry.location.lng} lat={res.data.results[0].geometry.location.lat}></LocDetails>);
      infowindow.setContent(html);
    }
  }

  //Switch Mode
  function onThemeChange(mode) {
    setTheme(mode);
  }

  //Initialize Map, InfoWindow, Marker and Get User Address
  function initMap(position) {
    //Init Map Using Coords
    const map = new google.maps.Map(ref.current, {
      center: { lat: position.coords.latitude, lng: position.coords.longitude },
      mapId: `${theme.mapId}`,
      zoom: 15,
      disableDefaultUI: true,
      fullscreenControl: true,
    });

    // Controls
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(findMeCtrlRef.current);
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(modeCtrlRef.current);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(modeCtrlDarkRef.current);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchRef.current);

    // Google Search API
    const options = {
      fields: ["formatted_address", "geometry", "name"],
      strictBounds: false,
      types: ["establishment"],
    };
    console.log(searchRef);
    const autocomplete = new google.maps.places.Autocomplete(searchRef.current, options);
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
      infowindow.close();
      // marker.setVisible(false);

      const place = autocomplete.getPlace();
      console.log("PLace change", place);
      console.log("Address is", searchRef.current.value);
      if (place) {
        findCoords(searchRef.current.value, place.formatted_address, infowindow);
      }

      if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }
    });

    console.log(google.maps, map.controls);
    setPMUMap(map);

    //Init Infowindow
    const infowindow = new google.maps.InfoWindow({
      content: "user location address...",
    });
    setPMUInfoWin(infowindow);

    //Init Marker
    const marker = new google.maps.Marker({
      map,
    });
    //Marker Event Listener To Open Infowindow
    marker.addListener("click", () => {
      infowindow.open({
        anchor: marker,
        map,
        shouldFocus: true,
      });
    });
    setPMUMarker(marker);

    findLocationDetails(position.coords.longitude, position.coords.latitude, infowindow);
  }

  //Setup Map Function
  function setupMap() {
    //Algorithm
    // 1) Get Device Location
    // 2) Create Map in Success Callback - GetCurrentPosition(), Using Location Coords On Success
    // 3) Also Setup Marker and Infowindow
    // 4) Store Map, Marker, Infowindow in State
    // 5) Find Location Address Using Coord - Google reverse Geocoding

    //Check If Device Supports Geolocation
    if (navigator && navigator.geolocation) {
      console.log("Geolocation Supported");

      //Request Permission To Access Position
      navigator.geolocation.getCurrentPosition(
        function (position) {
          console.log(position.coords);
          setLL({ lat: position.coords.latitude, lng: position.coords.longitude });
          initMap(position);
        },
        function (error) {
          console.log("An error has occured ", error.code, " ", error.message);
          window.alert(`${error.message} - Pls check and change your browser location permission settings`);
        }
      );
    } else {
      //Browser Dose Not Support Geolocation
      console.log("Geolocation Not Supported");
      window.alert("Geolocation not supported");
    }
  }

  //OnClick FindMe Button
  function onFindMe(coords) {
    console.log("IN find me", LngLat, PMUMarker, PMUMap);
    //Check and Clear any Marker
    if (PMUMarker) {
      PMUMarker.setMap(null);
    }

    if (PMUInfoWin) {
      PMUInfoWin.close();
      console.log("closing info window");
    }

    //Set Marker on Map i.e Make Marker now Visible
    PMUMarker.setMap(PMUMap);
    PMUMarker.setPosition(coords);
    PMUInfoWin.open({
      anchor: PMUMarker,
      map: PMUMap,
      shouldFocus: true,
    });
    PMUMap.setCenter(coords);
  }

  useEffect(() => {
    //Initialize App Map
    setupMap();
  }, []);

  useEffect(() => {
    setTheme(theme);
    console.log("Theme....", theme);
    setupMap();
  }, [theme]);

  useEffect(() => {
    setAdLL(AdLngLat);
    console.log("address changed", AdLngLat);
    if (AdLngLat) {
      onFindMe(AdLngLat);
    }
  }, [AdLngLat]);

  return (
    <div className="h-full w-full relative">
      <div className="w-full h-full" ref={ref} id="map" />

      <div className="hidden">
        <input
          ref={searchRef}
          className="absolute !top-20 !left-1/2 transform -translate-x-1/2 outline-none !text-base  border-slate-100 focus:border-slate-500 border rounded-xl bg-slate-50 px-5 py-3 w-2/3 md:w-70"
          placeholder="Enter your address"
        ></input>
        {/* Search Button */}

        {/* Find Me Button */}
        <button
          ref={findMeCtrlRef}
          onClick={() => {
            onFindMe(LngLat);
            findLocationDetails(LngLat.lng, LngLat.lat, PMUInfoWin);
          }}
          className={`rounded-xl ${
            theme.mode == "normal" ? "text-slate-100 bg-gray-800 " : "bg-slate-100 text-gray-900 "
          } text-xl absolute bottom-10 w-2/3 md:w-64 grid content-center cursor-pointer left-1/2 transform -translate-x-1/2 outline-none border-0 px-4 py-2`}
        >
          Find Me
        </button>

        {/* Toggle Mode Button */}
        <button
          ref={modeCtrlRef}
          onClick={() => {
            onThemeChange({ mode: "dark", mapId: "762f5b71fde50465" });
          }}
          className={`absolute !top-4 !left-2.5 rounded-xl text-slate-100 bg-gray-900 text-xl outline-none border-0 px-3 p-3 grid w-min h-min ${theme.mode == "normal" ? " block" : " hidden"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <button
          ref={modeCtrlDarkRef}
          onClick={() => {
            onThemeChange({ mode: "normal", mapId: "6ed6726e9c3addcc" });
          }}
          className={`absolute !top-4 !left-2.5 rounded-xl bg-slate-100 text-gray-900 text-xl outline-none border-0 px-3 p-3 w-min h-min ${theme.mode == "dark" ? " block" : " hidden"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Map;
