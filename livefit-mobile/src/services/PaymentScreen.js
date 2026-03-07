import React from "react";
import { WebView } from "react-native-webview";

export default function PaymentScreen({ route, navigation }) {

  const { orderId, amount, type, plan } = route.params;

  const html = `
  <html>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <body>
  <script>

  var options = {
      key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY}",
      amount: "${amount}",
      currency: "INR",
      name: "LiveFit",
      description: "${type} Payment",
      order_id: "${orderId}",

      handler: function (response){

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
      onMessage={(event)=>{

        const data = JSON.parse(event.nativeEvent.data);

        navigation.replace("PaymentSuccess",{
          paymentId:data.razorpay_payment_id,
          type,
          plan
        });

      }}
    />

  );

}