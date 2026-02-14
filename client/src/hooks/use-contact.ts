import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertContactRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCreateContactRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertContactRequest) => {
      const res = await fetch(api.contact.create.path, {
        method: api.contact.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }

      return api.contact.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for contacting Hanvitt Advisors. We will get back to you shortly.",
        variant: "default",
        className: "bg-[#1A2B49] text-white border-[#D4AF37]",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
