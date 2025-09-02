import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function useDeleteABooking() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: deleteABooking, isPending: isDeletingABooking } = useMutation(
    {
      mutationFn: (id) => deleteBooking(id),
      onSuccess: (data) => {
        toast.success(`Booking #${data.id} successfully deleted`);
        navigate("/");
        queryClient.removeQueries({ queryKey: ["booking", data.id] });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
      },
      onError: () => toast.error("There was an error while deleting booking"),
    }
  );
  return { deleteABooking, isDeletingABooking };
}
