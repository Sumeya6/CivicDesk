import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateTicketModal from "./CreateTicketModal";
import { useEffect } from "react";

export default function CreateTicket() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      navigate("/employee");
    }
  }, [isOpen, navigate]);

  return <CreateTicketModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
