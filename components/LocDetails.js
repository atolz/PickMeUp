import React from "react";

const LocDetails = ({ address, address2, lng, lat, locationtype }) => {
  return (
    <div className="max-w-[300px]">
      <p className=" border-b-gray-600 border-b pb-2 mb-2 border-dashed text-sm text-gray-600 font-medium">
        Address: <span className="text-sm text-gray-900 font-bold">{address} </span>
      </p>
      {address2 && (
        <p className=" border-b-gray-600 border-b pb-2 mb-2 border-dashed text-sm text-gray-600 font-medium">
          Address 2: <span className="text-sm text-gray-900 font-bold">{address2} </span>
        </p>
      )}
      <p>
        <span>Lng:{lng} </span>
      </p>
      <p>
        <span>Lat:{lat} </span>
      </p>
      <p>
        <span>Location Type:{locationtype} </span>
      </p>
    </div>
  );
};

export default LocDetails;
