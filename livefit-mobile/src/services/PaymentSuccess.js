import { View, Text, Button } from "react-native";
import API from "../services/api";

export default function PaymentSuccess({ route, navigation }) {

  const { type, plan } = route.params;

  const finishPayment = async () => {

    if(type === "order"){

      await API.post("/api/order/place");

    }

    if(type === "subscription"){

      await API.post("/api/subscribe",{plan});

    }

    navigation.navigate("Dashboard");

  };

  return(

    <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>

      <Text style={{fontSize:24}}>Payment Successful 🎉</Text>

      <Button title="Continue" onPress={finishPayment} />

    </View>

  );

}