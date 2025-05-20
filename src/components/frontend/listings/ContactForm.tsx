import React, { useState } from 'react';
import { LeadFormData } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { leadsApi } from '@/services/apiService';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';

interface ContactFormProps {
  listingId: number;
  listingName: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ listingId, listingName }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your name');
      return false;
    }
    
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    
    if (!formData.message.trim()) {
      setErrorMessage('Please enter a message');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    setFormStatus('idle');
    setErrorMessage('');
    
    try {
      console.log('Submitting lead for listing ID:', listingId);
      
      // Use our centralized leadsApi service
      const data = await leadsApi.createLead({
        listingId,
        ...formData
      });
      
      if (!data) {
        throw new Error('Failed to send message');
      }
      
      setFormStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Contact {listingName}</h3>
      
      {formStatus === 'success' ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-md flex items-start">
          <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">Message sent successfully!</p>
            <p className="text-green-600 dark:text-green-300 text-sm mt-1">
              Thank you for your message. The business will get back to you soon.
            </p>
            <Button 
              variant="outline" 
              className="mt-3 text-xs h-8"
              onClick={() => setFormStatus('idle')}
            >
              Send another message
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md flex items-start">
              <AlertCircle className="text-red-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200 text-sm">{errorMessage || 'Something went wrong. Please try again.'}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Your Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Your Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="I'm interested in your services..."
              required
              className="w-full min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Your message will be sent to the business administrator. They will contact you directly via the email you provide.
          </p>
        </form>
      )}
    </div>
  );
};

export default ContactForm;
