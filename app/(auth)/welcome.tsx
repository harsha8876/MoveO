import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
const OnBoarding = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex,setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === onboarding.length-1;
    return(
        <SafeAreaView className="flex h-full items-center justify-between bg-white">
            <TouchableOpacity onPress={()=>{
                router.replace('/sign-up');
            }}
            className="w-full flex justify-end items-end p-5"
            >
                <Text className="text-black text-md font-JakartaBold">Skip</Text>
            </TouchableOpacity>
            <Swiper
                ref={swiperRef}
                loop={false}
                dot = {<View className="w-[32px] h-[4px] mx-1 bg-[#B9B9C7] rounded-full"/>}
                activeDot = {<View className="w-[32px] h-[4px] mx-1 bg-[#8B8BA2] rounded-full" />}
                onIndexChanged={(index)=>setActiveIndex(index)}
            >
                {onboarding.map((item) => (
                    <View key={item.id} className="flex-1 items-center justify-center px-6">
                        <Image
                            source={item.image}
                            style={{ width: 270, height: 280 }}
                            className="mb-8"
                            resizeMode="contain"
                        />
                        <Text className="text-2xl text-black font-JakartaBold text-center">
                            {item.title}
                        </Text>
                        <Text className="mt-4 text-base text-center text-[#5D5D7D] font-JakartaRegular">
                            {item.description}
                        </Text>
                    </View>
                ))}
            </Swiper>
            <CustomButton
                title={isLastSlide ? "Get Started" : "Next"}
                onPress={() => {
                    if (isLastSlide) {
                        router.replace('/(auth)/sign-up');
                    } else {
                        swiperRef.current?.scrollBy(1);
                    }
                }}
                className="w-[90%] mb-8 bg-[#747490]"
            />
        </SafeAreaView>
    );
}

export default OnBoarding;