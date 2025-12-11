import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  status: string;
  trial_days_left: number;
  plan_name: string | null;
  is_trial_expired: boolean;
  loading: boolean;
  features?: any;
}

interface PlanLimits {
  staff: number | 'unlimited';
  appointments: number | 'unlimited';
  basic_reports: boolean;
  advanced_reports: boolean;
  email_support: boolean;
  priority_support: boolean;
  whatsapp_sms: boolean;
  online_bookings: boolean;
  api_access: boolean;
  multi_location: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    status: 'trial',
    trial_days_left: 14,
    plan_name: null,
    is_trial_expired: false,
    loading: true,
    features: null,
  });

  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    staff: 1,
    appointments: 50,
    basic_reports: true,
    advanced_reports: false,
    email_support: true,
    priority_support: false,
    whatsapp_sms: false,
    online_bookings: true,
    api_access: false,
    multi_location: false,
  });

  const checkSubscriptionStatus = async () => {
    if (!user) {
      setSubscription(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setSubscription(prev => ({ ...prev, loading: true }));
      
      // Get current user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData?.tenant_id) {
        console.log('User tenant error:', { userError, userData });
        throw new Error('User tenant not found');
      }

      // Check subscription status using our database function
      const { data, error } = await supabase.rpc('get_subscription_status', {
        tenant_uuid: userData.tenant_id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const statusData = data[0];
        
        // Get plan features if user has an active plan
        let planFeatures = null;
        if (statusData.status === 'active' && statusData.plan_name) {
          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('features')
            .eq('name', statusData.plan_name)
            .single();
          
          if (!planError && planData) {
            planFeatures = planData.features;
          }
        }

        setSubscription({
          status: statusData.status,
          trial_days_left: statusData.trial_days_left,
          plan_name: statusData.plan_name,
          is_trial_expired: statusData.is_trial_expired,
          loading: false,
          features: planFeatures,
        });

        // Set plan limits based on subscription status
        if (statusData.status === 'trial') {
          setPlanLimits({
            staff: 1,
            appointments: 50,
            basic_reports: true,
            advanced_reports: false,
            email_support: true,
            priority_support: false,
            whatsapp_sms: false,
            online_bookings: true,
            api_access: false,
            multi_location: false,
          });
        } else if (statusData.status === 'active' && planFeatures) {
          setPlanLimits({
            staff: planFeatures.staff || 1,
            appointments: planFeatures.appointments || 100,
            basic_reports: planFeatures.basic_reports || false,
            advanced_reports: planFeatures.advanced_reports || false,
            email_support: planFeatures.email_support || false,
            priority_support: planFeatures.priority_support || false,
            whatsapp_sms: planFeatures.whatsapp_sms || false,
            online_bookings: planFeatures.online_bookings || false,
            api_access: planFeatures.api_access || false,
            multi_location: planFeatures.multi_location || false,
          });
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const isTrialExpired = subscription.is_trial_expired;
  const canAccessFeatures = !isTrialExpired && (subscription.status === 'trial' || subscription.status === 'active');

  const checkLimit = async (type: 'staff' | 'appointments') => {
    if (!user) return { withinLimit: false, current: 0, limit: 0 };

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData?.tenant_id) return { withinLimit: false, current: 0, limit: 0 };

      if (type === 'staff') {
        const { count, error } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', userData.tenant_id)
          .eq('active', true);

        if (error) return { withinLimit: false, current: 0, limit: planLimits.staff };
        
        const currentStaff = count || 0;
        const staffLimit = planLimits.staff;
        const withinLimit = staffLimit === 'unlimited' || currentStaff < staffLimit;
        
        return { withinLimit, current: currentStaff, limit: staffLimit };
      } else if (type === 'appointments') {
        // Count appointments for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const { count, error } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', userData.tenant_id)
          .gte('start_at', startOfMonth.toISOString())
          .lte('start_at', endOfMonth.toISOString());

        if (error) return { withinLimit: false, current: 0, limit: planLimits.appointments };
        
        const currentAppointments = count || 0;
        const appointmentLimit = planLimits.appointments;
        const withinLimit = appointmentLimit === 'unlimited' || currentAppointments < appointmentLimit;
        
        return { withinLimit, current: currentAppointments, limit: appointmentLimit };
      }
    } catch (error) {
      console.error('Error checking limits:', error);
      return { withinLimit: false, current: 0, limit: 0 };
    }

    return { withinLimit: false, current: 0, limit: 0 };
  };

  return {
    ...subscription,
    isTrialExpired,
    canAccessFeatures,
    planLimits,
    checkLimit,
    refreshStatus: checkSubscriptionStatus,
  };
};