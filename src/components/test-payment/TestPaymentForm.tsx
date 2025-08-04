'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface PaymentFormData {
  customerName: string;
  email: string;
  phone: string;
  bookingDate: string;
  castleType: string;
  depositAmount: string;
  paymentMethod: string;
  specialRequests: string;
}

export function TestPaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    customerName: '',
    email: '',
    phone: '',
    bookingDate: '',
    castleType: '',
    depositAmount: '50',
    paymentMethod: '',
    specialRequests: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setShowSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        bookingDate: '',
        castleType: '',
        depositAmount: '50',
        paymentMethod: '',
        specialRequests: '',
      });
    }, 3000);
  };

  const castleTypes = [
    { value: 'princess-palace', label: 'Princess Palace Castle', price: 120 },
    { value: 'superhero-adventure', label: 'Superhero Adventure Castle', price: 140 },
    { value: 'jungle-safari', label: 'Jungle Safari Castle', price: 130 },
    { value: 'medieval-knight', label: 'Medieval Knight Castle', price: 150 },
    { value: 'rainbow-unicorn', label: 'Rainbow Unicorn Castle', price: 135 },
  ];

  const selectedCastle = castleTypes.find(castle => castle.value === formData.castleType);

  if (showSuccess) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Test Payment Successful!</h3>
            <p className="text-green-700 mb-4">
              This was a simulated payment process. In the live system, payment would be processed securely 
              through your chosen payment provider.
            </p>
            <div className="bg-white/60 rounded-lg p-4 text-sm text-green-700">
              <p><strong>Test Booking Details:</strong></p>
              <p>Customer: {formData.customerName}</p>
              <p>Castle: {selectedCastle?.label}</p>
              <p>Deposit: £{formData.depositAmount}</p>
              <p>Date: {formData.bookingDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Test Deposit Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 border-b pb-1">Customer Information</h3>
            
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter your full name"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XXX XXXXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 border-b pb-1">Booking Details</h3>
            
            <div>
              <Label htmlFor="bookingDate">Event Date *</Label>
              <Input
                id="bookingDate"
                type="date"
                value={formData.bookingDate}
                onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                required
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="castleType">Select Castle *</Label>
              <Select onValueChange={(value) => handleInputChange('castleType', value)} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose your bouncy castle" />
                </SelectTrigger>
                <SelectContent>
                  {castleTypes.map((castle) => (
                    <SelectItem key={castle.value} value={castle.value}>
                      {castle.label} - £{castle.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special requirements or requests..."
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 border-b pb-1">Payment Details</h3>
            
            {selectedCastle && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Total Castle Hire:</span>
                  <span className="font-bold text-blue-800">£{selectedCastle.price}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-green-800">Deposit Required:</span>
                  <span className="font-bold text-green-800">£{formData.depositAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
                  <span>Remaining on delivery:</span>
                  <span>£{selectedCastle.price - parseInt(formData.depositAmount)}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="depositAmount">Deposit Amount (£) *</Label>
              <Select 
                onValueChange={(value) => handleInputChange('depositAmount', value)} 
                defaultValue="50"
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select deposit amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">£25 - Minimum deposit</SelectItem>
                  <SelectItem value="50">£50 - Standard deposit</SelectItem>
                  <SelectItem value="75">£75 - Secure booking</SelectItem>
                  <SelectItem value="100">£100 - Full security deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Test Payment Method *</Label>
              <Select onValueChange={(value) => handleInputChange('paymentMethod', value)} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe (Recommended) - 1.5% + 20p</SelectItem>
                  <SelectItem value="square">Square - 1.4% + 25p</SelectItem>
                  <SelectItem value="paypal">PayPal - 2.9% + 30p</SelectItem>
                  <SelectItem value="open-banking">Open Banking - 0.5% + 20p</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Test Card Information Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Test Mode Information
            </h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• This is a simulation - no real payment will be processed</p>
              <p>• Use test card: 4242 4242 4242 4242 (any future date, any CVC)</p>
              <p>• All data entered here is for testing purposes only</p>
              <p>• Real implementation will use secure payment processing</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transform transition hover:scale-105 shadow-lg"
            disabled={isProcessing || !formData.customerName || !formData.email || !formData.phone || !formData.bookingDate || !formData.castleType || !formData.paymentMethod}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Test Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Process Test Payment (£{formData.depositAmount})
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}