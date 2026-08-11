import { APIProvider } from "@vis.gl/react-google-maps";
import { PlacesMap } from "./PlacesMap";

export default function App() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_PUBLIC_KEY}>
      <PlacesMap />
    </APIProvider>
  );
}
