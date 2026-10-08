import { gql } from "@apollo/client";

export const GET_ZONES = gql`
  query Zones {
    zones {
      _id
      title
      description
      location {
        coordinates
      }
      isActive
    }
  }
`;

export const ZONE_BY_LOCATION = gql`
  query ZoneByLocation($latitude: Float!, $longitude: Float!) {
    zoneByLocation(latitude: $latitude, longitude: $longitude) {
      _id
      title
    }
  }
`;

export const ZONE_BY_AREA = gql`
  query ZoneByArea($area: String!) {
    zoneByArea(area: $area) {
      _id
      title
    }
  }
`;
