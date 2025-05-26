// src/services/emailService.js
// Email service for sending notifications via EmailJS

import emailjs from '@emailjs/browser';

// EmailJS configuration - you'll need to set these up in your EmailJS account
const EMAILJS_SERVICE_ID = 'service_5j87px5'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_q57cdcs'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'b30T49jF0Rfq0Cehv'; // Replace with your EmailJS public key

export const initializeEmailJS = () => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✅ EmailJS initialized with service:', EMAILJS_SERVICE_ID);
};

// Enhanced email function with better error handling and logging
export const sendEmergencyNotificationEmail = async (operatorData, emergencyData) => {
  console.log('📧 Attempting to send emergency email...');
  console.log('To:', operatorData.email);
  console.log('Emergency:', emergencyData.type, emergencyData.id?.substring(0, 8));
  
  try {
    // Validate required data
    if (!operatorData.email) {
      throw new Error('Operator email is missing');
    }
    
    if (!emergencyData.id) {
      throw new Error('Emergency ID is missing');
    }

    const templateParams = {
      to_email: operatorData.email,
      to_name: operatorData.displayName || 'Drone Operator',
      emergency_type: emergencyData.type || 'Emergency',
      emergency_id: emergencyData.id.substring(0, 8),
      emergency_details: emergencyData.details || 'No details provided',
      emergency_location: emergencyData.address || 'Location not specified',
      distance: operatorData.distance ? `${operatorData.distance.toFixed(2)} km` : 'Unknown distance',
      emergency_link: `${window.location.origin}/emergency/${emergencyData.id}`,
      created_time: emergencyData.createdAt ? new Date(emergencyData.createdAt).toLocaleString() : 'Unknown time',
      app_name: 'AeroAid',
      app_url: window.location.origin,
      reply_to: 'noreply@aeroaid.com', // or your preferred no-reply email
    };

    console.log('📧 Template params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending emergency notification email:', error);
    
    // Log specific error details
    if (error.text) {
      console.error('EmailJS error details:', error.text);
    }
    
    return { success: false, error: error.message || error.text || 'Unknown email error' };
  }
};

// Test email function with detailed logging
export const sendTestEmail = async (recipientEmail, recipientName = 'Test User') => {
  console.log('📧 Sending test email to:', recipientEmail);
  
  try {
    const templateParams = {
      to_email: recipientEmail,
      to_name: recipientName,
      emergency_type: 'Test Emergency',
      emergency_id: 'TEST123',
      emergency_details: 'This is a test email to verify the email notification system is working correctly.',
      emergency_location: 'Test Location - System Check',
      distance: '1.5 km',
      emergency_link: `${window.location.origin}/dashboard`,
      created_time: new Date().toLocaleString(),
      app_name: 'AeroAid',
      app_url: window.location.origin,
      reply_to: 'noreply@aeroaid.com',
    };

    console.log('📧 Test email template params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Test email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    
    if (error.text) {
      console.error('EmailJS error details:', error.text);
    }
    
    return { success: false, error: error.message || error.text || 'Unknown email error' };
  }
};

// Function to validate EmailJS configuration
export const validateEmailJSConfig = () => {
  console.log('🔍 Validating EmailJS Configuration...');
  
  const issues = [];
  
  if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID_HERE') {
    issues.push('❌ EMAILJS_SERVICE_ID not configured');
  } else {
    console.log('✅ Service ID configured:', EMAILJS_SERVICE_ID);
  }
  
  if (EMAILJS_TEMPLATE_ID === 'emergency_notification') {
    console.log('✅ Template ID configured:', EMAILJS_TEMPLATE_ID);
  } else {
    issues.push('❌ Template ID should be "emergency_notification"');
  }
  
  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE') {
    issues.push('❌ EMAILJS_PUBLIC_KEY not configured');
  } else {
    console.log('✅ Public Key configured:', EMAILJS_PUBLIC_KEY.substring(0, 10) + '...');
  }
  
  if (issues.length > 0) {
    console.error('🚨 EmailJS Configuration Issues:');
    issues.forEach(issue => console.error(issue));
    return false;
  }
  
  console.log('✅ EmailJS configuration looks good!');
  return true;
};