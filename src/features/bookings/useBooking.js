import { useQuery } from "@tanstack/react-query";
import { getBooking } from "../../services/apiBookings";
import { useParams } from "react-router-dom";

export function useBooking() {
  const { bookingId } = useParams();
  const id = Number(bookingId);
  const {
    isPending,
    data: booking,
    error,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBooking(id),
  });
  return { isPending, booking };
}
