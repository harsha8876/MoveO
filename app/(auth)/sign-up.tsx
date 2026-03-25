import React, { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter, type Href } from "expo-router";
import { useAuth, useSignUp } from '@clerk/expo';
import ReactNativeModal from "react-native-modal";
import { images } from "@/constants";
import InputFields from "@/components/InputFields";
import CustomButton from "@/components/CustomButton";
import OAuth from "@/components/OAuth";

const SignUp = () => {
  // Clerk Hooks
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Verification States
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [code, setCode] = useState("");

  // Prevent rendering if already authenticated
  if (signUp?.status === 'complete' || isSignedIn) {
    return null;
  }

  // --- 1. Sign Up Logic ---
  const onSignUpPress = async () => {
    if (!signUp) return;

    try {
      // Pass the email and password to Clerk
      const { error } = await signUp.password({
        emailAddress: email,
        password: password,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        Alert.alert("Error", "Failed to sign up. Please check your details.");
        return;
      }

      // If successful, send verification email and switch UI state
      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
      
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign Up Error", err.errors?.[0]?.longMessage || "Something went wrong.");
    }
  };

  // --- 2. Verification Logic ---
  const onVerifyPress = async () => {
    if (!signUp) return;

    try {
      await signUp.verifications.verifyEmailCode({
        code,
      });

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: () => {},
        });

        setShowSuccessModal(true);
      } else {
        console.error('Sign-up attempt not complete:', signUp);
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Verification Error", err.errors?.[0]?.longMessage || "Invalid code.");
    }
  };

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
            Create Your Account
          </Text>
        </View>

        <View className="px-6 py-8">
          {/* Dynamic Header based on Verification State */}
          <Text className="mb-2 text-2xl text-black font-JakartaBold">
            {pendingVerification ? "Verify your account" : "Welcome to MoveO"}
          </Text>
          <Text className="mb-8 text-base text-[#5D5D7D] font-JakartaRegular">
            {pendingVerification 
              ? `We've sent a verification code to ${email}.` 
              : "Sign up to book rides, manage trips, and enjoy a smoother travel experience."}
          </Text>

          {/* Conditional Rendering: OTP Form vs Sign Up Form */}
          {pendingVerification ? (
            <>
              <InputFields
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              {errors?.fields?.code && (
                <Text className="text-red-500 mt-[-8px] text-xs">
                  {errors.fields.code.message}
                </Text>
              )}

              <CustomButton
                title="Verify Email"
                onPress={onVerifyPress}
                className="mt-4 bg-[#0a7ea4]"
                disabled={fetchStatus === 'fetching'}
              />

              <TouchableOpacity 
                className="mt-4 items-center"
                onPress={() => signUp.verifications.sendEmailCode()}
              >
                <Text className="text-base text-primary font-JakartaBold">
                  Resend Code
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <InputFields
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              />

              <InputFields
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              {errors?.fields?.emailAddress && (
                <Text className="text-red-500 mt-[-8px] text-xs">
                  {errors.fields.emailAddress.message}
                </Text>
              )}

              <InputFields
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {errors?.fields?.password && (
                <Text className="text-red-500 mt-[-8px] text-xs">
                  {errors.fields.password.message}
                </Text>
              )}

              <CustomButton
                title="Sign Up"
                onPress={onSignUpPress}
                className="mt-4 bg-[#747490]"
                disabled={!email || !password || fetchStatus === 'fetching'}
              />

              <OAuth/>

              <View className="mt-6 flex-row justify-center">
                <Text className="text-base text-[#5D5D7D] font-JakartaRegular">
                  Already have an account? 
                </Text>
                <Link href="/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="text-base text-primary font-JakartaBold ml-1">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          )}

          {/* Fallback Clerk Captcha View (Required for Clerk bot protection) */}
          <View nativeID="clerk-captcha" />
        </View>
        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />
            <Text className="text-3xl font-JakartaBold text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Browse Home"
              onPress={() => router.push(`/(root)/(tabs)/home`)}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </SafeAreaView>
    </ScrollView>
  );
};

export default SignUp;