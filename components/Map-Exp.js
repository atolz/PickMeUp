import React, { useState } from "react";
import { useRef, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import axios from "axios";

import LocDetails from "./LocDetails";

const Map = () => {
  const ref = useRef();
  const [lnglat, setlnglat] = useState({ lat: 0, lng: 0 });
  const [myMap, setMap] = useState(null);
  const [myMarker, setMarker] = useState(null);
  const [myInfoWindow, setInfoWindow] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);

  async function findLocationDetails(lng, lat) {
    //1) Send google geo coding api
    const res = await axios(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lnglat.lat},${lnglat.lng}&key=AIzaSyCXLrz-WThV4cNntmzzW4w75L7uwqU-u14`, {
      method: "GET",
    });

    if (res.data.results[0]) {
      console.log(res.data.results[0].formatted_address);
      const html = ReactDOMServer.renderToString(
        <LocDetails
          address={res.data.results[0].formatted_address}
          address2={res.data.results[2].formatted_address}
          lng={lnglat.lng}
          lat={lnglat.lat}
          locationtype={res.data.results[0].geometry.location_type}
        ></LocDetails>
      );
      myInfoWindow.setContent(html);
    }
    return res;
    //2) Get response
    //3) Set Location details
  }

  function onFind() {
    //1) Check for geolocation support
    //2) On success geoloaction support and accept, update lnglat with device location
    console.log("Finding location");
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log(pos);
          setlnglat({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          console.log(lnglat);
          //   myMap.setCenter(lnglat);
          //Check if any marker is on the map and remove
          if (myMarker) {
            myMarker.setMap(null);
          }
        },
        (err) => {
          console.log("Error getting geolocation", err.message);
        }
      );
    } else {
      console.log("Your browser dose not support geolocation service");
    }
  }

  useEffect(() => {
    console.log("running useEffect");
    //Initialize the map
    const map = new google.maps.Map(ref.current, {
      center: lnglat,
      mapId: "6ed6726e9c3addcc",
      zoom: 15,
      disableDefaultUI: true,
      fullscreenControl: true,
    });
    setMap(map);

    //SetUp info window
    const infowindow = new google.maps.InfoWindow({
      content: "user location address",
    });
    setInfoWindow(infowindow);

    //Setup marker
    const marker = new google.maps.Marker({});
    marker.addListener("click", () => {
      console.log("marker clicked", myMarker);
      //   console.log("info window instance position marker", marker.getPosition());

      infowindow.open({
        anchor: marker,
        map,
        shouldFocus: true,
      });
    });
    setMarker(marker);
  }, []);

  useEffect(() => {
    console.log("lng lat change", lnglat, myMap);
    setlnglat(lnglat);
    const test = findLocationDetails(lnglat.lat, lnglat.lng);
    console.log("promsie check", test);
    console.log("after promise resolve");
    if (myMap) {
      //Create a new marker based on lng and lat
      myMarker.setMap(myMap);
      myMarker.setPosition(lnglat);
      myInfoWindow.open({
        anchor: myMarker,
        myMap,
        shouldFocus: false,
      });
      myMap.setCenter(myMarker.getPosition());
    }
  }, [lnglat]);

  return (
    <div className="h-full w-full relative">
      <div className="w-full h-full" ref={ref} id="map" />
      <button onClick={onFind} className="rounded text-slate-100 bg-gray-900 text-xl absolute bottom-3 cursor-pointer flex left-1/2 transform -translate-x-1/2 outline-none border-0 px-4 py-2">
        Find Me
      </button>
    </div>
  );
};

export default Map;
