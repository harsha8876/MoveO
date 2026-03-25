import { Redirect } from "expo-router";
import { useAuth } from "@clerk/expo";

const Home = () => {

  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return null
  }

  // If user is signed in, send them to the main app home screen
  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)/home" />;
  }

  // Otherwise show onboarding / auth flow
  return <Redirect href="/(auth)/welcome" />;
};
export default Home;