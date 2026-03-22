const Newsletter = require('../models/Newsletter');

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ email });
    
    if (existingSubscription) {
      if (existingSubscription.subscribed) {
        return res.status(400).json({ message: 'Email already subscribed' });
      } else {
        // Resubscribe
        existingSubscription.subscribed = true;
        existingSubscription.unsubscribedAt = null;
        await existingSubscription.save();
        return res.json({ success: true, message: 'Successfully resubscribed to newsletter' });
      }
    }

    // Create new subscription
    await Newsletter.create({ email });
    
    res.json({ success: true, message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter', error: error.message });
  }
};

const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscription = await Newsletter.findOne({ email });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Email not found in subscriptions' });
    }

    subscription.subscribed = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.json({ success: true, message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ message: 'Error unsubscribing from newsletter', error: error.message });
  }
};

const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Newsletter.find({ subscribed: true }).select('email createdAt');
    
    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getSubscriptions
};