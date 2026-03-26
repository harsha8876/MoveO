import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Href, Link, useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { images } from "@/constants";
import InputFields from "@/components/InputFields";
import CustomButton from "@/components/CustomButton";
import OAuth from "@/components/OAuth";

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      });

      if (error) {

        const message =
          (error as any)?.errors?.[0]?.longMessage ||
          (error as any)?.errors?.[0]?.message ||
          "Invalid email or password.";

        Alert.alert("Sign In Error", message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            const url = decorateUrl("/");
            router.push(url as Href);
          },
        });
      } else if (signIn.status === "needs_second_factor") {
        console.log("Second factor authentication is required.");
      } else if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
        }
      } else {
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }

          const url = decorateUrl("/");
          router.push(url as Href);
        },
      });
    } else {
    }
  };

  const showVerificationStep = signIn.status === "needs_client_trust";

  return (
    <ScrollView className="flex-1 bg-white">
      <SafeAreaView className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={images.signUpCar}
            className="z-0 w-full h-[250px]"
            resizeMode="cover"
          />
          <Text className="absolute bottom-5 left-5 text-3xl text-black font-JakartaBold">
            {showVerificationStep ? "Verify Your Account" : "Welcome Back"}
          </Text>
        </View>

        <View className="px-6 py-8">
          {!showVerificationStep ? (
            <>
              <Text className="mb-2 text-2xl text-black font-JakartaBold">
                Sign In to MoveO
              </Text>
              <Text className="mb-8 text-base text-[#5D5D7D] font-JakartaRegular">
                Enter your credentials to continue booking rides.
              </Text>

              <InputFields
                label="Email"
                placeholder="Enter your email"
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
              />
              {errors?.fields?.identifier && (
                <Text className="mb-3 text-xs text-red-600 font-JakartaRegular">
                  {errors.fields.identifier.message}
                </Text>
              )}

              <InputFields
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {errors?.fields?.password && (
                <Text className="mb-3 text-xs text-red-600 font-JakartaRegular">
                  {errors.fields.password.message}
                </Text>
              )}

              <CustomButton
                title="Continue"
                onPress={handleSubmit}
                disabled={!emailAddress || !password || fetchStatus === "fetching"}
                className="mt-4 bg-[#747490]"
              />

              <OAuth />
            </>
          ) : (
            <>
              <Text className="mb-2 text-2xl text-black font-JakartaBold">
                Verify your account
              </Text>
              <Text className="mb-8 text-base text-[#5D5D7D] font-JakartaRegular">
                Enter the verification code sent to your email.
              </Text>

              <InputFields
                label="Verification Code"
                placeholder="Enter your verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              {errors?.fields?.code && (
                <Text className="mb-3 text-xs text-red-600 font-JakartaRegular">
                  {errors.fields.code.message}
                </Text>
              )}

              <CustomButton
                title="Verify"
                onPress={handleVerify}
                disabled={!code || fetchStatus === "fetching"}
                className="mt-4 bg-[#747490]"
              />

              <TouchableOpacity
                onPress={() => signIn.mfa.sendEmailCode()}
                className="mt-4 items-center"
              >
                <Text className="text-base text-primary font-JakartaBold">
                  I need a new code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => signIn.reset()}
                className="mt-4 items-center"
              >
                <Text className="text-base text-primary font-JakartaBold">
                  Start over
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View className="mt-6 flex-row justify-center">
            <Text className="text-base text-[#5D5D7D] font-JakartaRegular">
              Don&apos;t have an account? 
            </Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-base text-primary font-JakartaBold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default SignIn;