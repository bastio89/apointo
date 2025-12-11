#!/usr/bin/env python3
"""
Script to create Sebastian Weber's appointment for testing calendar integration
"""
import requests
import json
from datetime import datetime, timezone

# Configuration
BASE_URL = "https://daylane-booking.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def create_test_tenant_and_appointment():
    """Create a test tenant with staff, service, and Sebastian's appointment"""
    
    # Step 1: Register a test tenant
    print("🔍 Step 1: Creating test tenant...")
    tenant_data = {
        "name": "Barber Shop Sebastian Test",
        "slug": "barber-sebastian-test",
        "email": "sebastian.test@example.com",
        "password": "TestPass123!",
        "phone": "+41 44 123 45 67"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=tenant_data)
    if response.status_code != 200:
        print(f"❌ Failed to register tenant: {response.status_code} - {response.text}")
        return None
        
    tenant_response = response.json()
    token = tenant_response['access_token']
    tenant_id = tenant_response['tenant']['id']
    
    print(f"✅ Tenant created: {tenant_response['tenant']['name']}")
    print(f"   Tenant ID: {tenant_id}")
    print(f"   Login URL: {BASE_URL}/login")
    print(f"   Email: {tenant_data['email']}")
    print(f"   Password: {tenant_data['password']}")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Step 2: Create staff member (Michael Müller)
    print("\n🔍 Step 2: Creating staff member...")
    staff_data = {
        "name": "Michael Müller",
        "color_tag": "#3B82F6"
    }
    
    response = requests.post(f"{API_URL}/staff", json=staff_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create staff: {response.status_code} - {response.text}")
        return None
        
    staff_response = response.json()
    staff_id = staff_response['id']
    print(f"✅ Staff created: {staff_response['name']} (ID: {staff_id})")
    
    # Step 3: Create service (Herren Kurzhaar)
    print("\n🔍 Step 3: Creating service...")
    service_data = {
        "name": "Herren Kurzhaar",
        "description": "Professioneller Herrenhaarschnitt",
        "duration_minutes": 35,
        "price_chf": 45.0,
        "buffer_minutes": 5
    }
    
    response = requests.post(f"{API_URL}/services", json=service_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create service: {response.status_code} - {response.text}")
        return None
        
    service_response = response.json()
    service_id = service_response['id']
    print(f"✅ Service created: {service_response['name']} (ID: {service_id})")
    
    # Step 4: Create Sebastian's appointment for August 23, 2025 at 10:00
    print("\n🔍 Step 4: Creating Sebastian Weber's appointment...")
    appointment_data = {
        "service_id": service_id,
        "staff_id": staff_id,
        "start_at": "2025-08-23T10:00:00Z",
        "customer_name": "Sebastian Weber",
        "customer_email": "sebastian.weber@example.com",
        "customer_phone": "+41 79 987 65 43",
        "notes": "Test appointment for calendar verification"
    }
    
    response = requests.post(f"{API_URL}/appointments", json=appointment_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create appointment: {response.status_code} - {response.text}")
        return None
        
    appointment_response = response.json()
    print(f"✅ Sebastian's appointment created!")
    print(f"   Appointment ID: {appointment_response['id']}")
    print(f"   Customer: {appointment_response['customer_name']}")
    print(f"   Date/Time: {appointment_response['start_at']}")
    print(f"   Service: Herren Kurzhaar")
    print(f"   Staff: Michael Müller")
    
    # Step 5: Verify appointment exists
    print("\n🔍 Step 5: Verifying appointment exists...")
    response = requests.get(f"{API_URL}/appointments", headers=headers)
    if response.status_code == 200:
        appointments = response.json()
        sebastian_appointments = [apt for apt in appointments if apt.get('customer_name') == 'Sebastian Weber']
        
        if sebastian_appointments:
            print(f"✅ Verification successful! Found {len(sebastian_appointments)} appointment(s) for Sebastian Weber")
            for apt in sebastian_appointments:
                print(f"   - {apt['customer_name']} on {apt['start_at']} ({apt.get('service_name', 'Unknown service')})")
        else:
            print(f"❌ Verification failed! Sebastian's appointment not found in {len(appointments)} total appointments")
    else:
        print(f"❌ Failed to verify appointments: {response.status_code}")
    
    return {
        'tenant_id': tenant_id,
        'token': token,
        'staff_id': staff_id,
        'service_id': service_id,
        'appointment_id': appointment_response['id'],
        'login_email': tenant_data['email'],
        'login_password': tenant_data['password']
    }

if __name__ == "__main__":
    print("🚀 Creating Sebastian Weber's Test Appointment")
    print("=" * 60)
    
    result = create_test_tenant_and_appointment()
    
    if result:
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Test data created successfully")
        print("=" * 60)
        print(f"Dashboard URL: {BASE_URL}/dashboard")
        print(f"Login Email: {result['login_email']}")
        print(f"Login Password: {result['login_password']}")
        print("\nNext steps:")
        print("1. Login to the dashboard using the credentials above")
        print("2. Navigate to the Calendar tab")
        print("3. Look for Sebastian Weber's appointment on August 23, 2025 at 10:00")
        print("4. Verify the appointment shows correct details (service, staff, time)")
    else:
        print("\n❌ FAILED to create test data")
        exit(1)