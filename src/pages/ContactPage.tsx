import React from 'react';
import { Contact2 } from '@/components/ui/contact-2'; // Using shadcn alias

const ContactPage: React.FC = () => {
  return (
    <Contact2 
      title="Get in Touch"
      description="Have a question, a project idea, or just want to say hello? We'd love to hear from you. Fill out the form below or use our contact details."
      // You can customize phone, email, and web props here if needed, 
      // or let them use the defaults from Contact2 component
      // phone="(Your) Phone Number"
      // email="your.email@example.com"
      // web={{ label: "YourWebsite.com", url: "https://yourwebsite.com" }}
    />
  );
};

export default ContactPage;
