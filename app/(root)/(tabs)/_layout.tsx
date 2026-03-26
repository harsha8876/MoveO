import { icons } from "@/constants";
import { Tabs } from "expo-router";
import { View, Image, ImageSourcePropType, Text } from "react-native";

const TabIcon = ({
  source,
  focused,
  title,
}: {
  source: ImageSourcePropType;
  focused: boolean;
  title: string;
}) => {
  return (
    <View className="items-center justify-center mt-3 rounded-full">
      <View
        className="items-center justify-center rounded-2xl px-4 py-2"
        style={{
          backgroundColor: focused ? "#5D5D7D" : "transparent",
          minWidth: 70,
            minHeight: focused ? 48 : 40,
          paddingVertical: focused ? 7 : 6,
          borderRadius:999
         
        }}
      >
        <Image
          source={source}
          className="w-6 h-6 mb-1"
          resizeMode="contain"
          style={{ tintColor: focused ? "#FFFFFF" : "#747490" }}
        />
        <Text
          style={{
            color: focused ? "#FFFFFF" : "#747490",
            fontSize: 12,
            fontWeight: focused ? "600" : "500",
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};

const Layout = () => {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#747490",
        
        tabBarStyle: {
          backgroundColor: "#B9B9C7",
          borderTopWidth: 0,
          height: 78,
          paddingTop: 10,
          paddingBottom: 10,
          elevation: 0,
          marginHorizontal: 10,
          marginBottom: 20,
          borderRadius: 600,
          position: 'absolute',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          flexDirection:'row'
          
        },
        tabBarItemStyle: {
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.list} title="Rides" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.chat} title="Chat" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} source={icons.profile} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;