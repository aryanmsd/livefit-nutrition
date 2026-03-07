async function startPayment(amount) {

    const token = localStorage.getItem("authToken");
  
    try {
  
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ amount })
      });
  
      const data = await res.json();
  
      const order = data.order;
      const key = data.key;
  
      const options = {
  
        key: key,
        amount: order.amount,
        currency: "INR",
        name: "Aryan",
        description: "Meal Order",
        order_id: order.id,
  
        handler: async function (response) {
  
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify(response)
          });
  
          const verifyData = await verify.json();
  
          if (verifyData.success) {
  
            await fetch("/api/order/place", {
              method: "POST",
              headers: {
                "Authorization": "Bearer " + token
              }
            });
  
            alert("Payment Successful & Order Placed!");
  
            location.reload();
  
          } else {
  
            alert("Payment verification failed");
  
          }
  
        }
  
      };
  
      const rzp = new Razorpay(options);
      rzp.open();
  
    } catch (err) {
  
      console.error("Payment error:", err);
      alert("Payment failed");
  
    }
  
  }