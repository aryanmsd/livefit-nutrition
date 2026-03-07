import { Platform, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Payment() {

  const router = useRouter();
  const params = useLocalSearchParams();

  const paymentUrl =
    `http://localhost:4000/payment-page?orderId=${params.orderId}&amount=${params.amount}`;

  /* ---------- WEB ---------- */

  if (Platform.OS === "web") {

    Linking.openURL(paymentUrl);

    router.replace("/(tabs)/dashboard");

    return null;
  }

  /* ---------- MOBILE ---------- */

  const html = `
  <html>
  <body>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

  <script>

  var options = {
      key: "${params.key}",
      amount: "${params.amount}",
      currency: "INR",
      name: "LiveFit",
      description: "Payment",
      order_id: "${params.orderId}",

      handler: function (response) {

        window.ReactNativeWebView.postMessage(JSON.stringify(response));

      }

  };

  var rzp = new Razorpay(options);
  rzp.open();

  </script>

  </body>
  </html>
  `;

  return (

    <WebView
      originWhitelist={["*"]}
      source={{ html }}

      onMessage={() => {

        router.replace({
          pathname: "../payment-success",
          params: {
            type: params.type,
            plan: params.plan
          }
        });

      }}

    />

  );

}