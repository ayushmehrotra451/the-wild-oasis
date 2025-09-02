import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: ({ email, password }) => loginApi({ email, password }),
    onSuccess: (loginData) => {
      queryClient.setQueryData(["user"], loginData.user);
      navigate("/dashboard", { replace: true });
    },
    onError: () => {
      toast.error("Provided email or password are incorrect");
    },
  });

  return { login, isLoggingIn };
}
