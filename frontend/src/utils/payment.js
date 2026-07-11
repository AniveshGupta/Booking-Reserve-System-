import api from "../api/axios";

/**
 * Creates a Razorpay order for a booking, opens the checkout modal,
 * and verifies the payment on success.
 *
 * @param {Object} params
 * @param {Object} params.booking - the booking object (must have _id, depositAmount)
 * @param {Object} params.user - current logged in user (name, email, phone)
 * @param {Function} params.onSuccess - called with the verified booking
 * @param {Function} params.onError - called with an error message
 * @param {Function} params.onDismiss - called if the user closes the modal without paying
 */
export function payForBooking({ booking, user, onSuccess, onError, onDismiss }) {
  api
    .post("/payments/create-order", { bookingId: booking._id })
    .then(({ data }) => {
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Mezban",
        description: `Reservation deposit — ${booking.table?.label || "Table"}`,
        order_id: data.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#d9a441" },
        handler: function (response) {
          api
            .post("/payments/verify", {
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            .then((res) => onSuccess?.(res.data.booking))
            .catch((err) => onError?.(err.response?.data?.message || "Payment verification failed"));
        },
        modal: {
          ondismiss: function () {
            onDismiss?.();
          },
        },
      };

      if (!window.Razorpay) {
        onError?.("Payment gateway failed to load. Check your internet connection and try again.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        onError?.(response.error?.description || "Payment failed");
      });
      rzp.open();
    })
    .catch((err) => {
      onError?.(err.response?.data?.message || "Could not start payment");
    });
}
