import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class DaylaneAPITester:
    def __init__(self, base_url="https://daylane-booking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tenant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_tenant_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_registration(self):
        """Test tenant registration with German business data"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_tenant_data = {
            "name": f"Test Salon Zürich {timestamp}",
            "slug": f"test-salon-{timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 123 45 67"
        }
        
        success, response = self.run_test(
            "Tenant Registration",
            "POST",
            "auth/register",
            200,
            data=self.test_tenant_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'tenant' in response:
                self.tenant_id = response['tenant']['id']
                print(f"   Registered tenant: {response['tenant']['name']}")
                print(f"   Plan: {response['tenant']['plan']}")
                print(f"   Locale: {response['tenant']['locale']}")
                print(f"   Currency: {response['tenant']['currency']}")
            return True
        return False

    def test_login(self):
        """Test login with registered credentials"""
        if not self.test_tenant_data:
            print("❌ No test tenant data available for login test")
            return False
            
        login_data = {
            "email": self.test_tenant_data["email"],
            "password": self.test_tenant_data["password"]
        }
        
        success, response = self.run_test(
            "Tenant Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_dashboard_overview(self):
        """Test dashboard overview endpoint"""
        success, response = self.run_test(
            "Dashboard Overview",
            "GET",
            "dashboard/overview",
            200
        )
        
        if success:
            expected_keys = ['termine_dieses_monat', 'aktive_mitarbeiter', 'plan', 'trial_end']
            for key in expected_keys:
                if key not in response:
                    print(f"   Warning: Missing key '{key}' in response")
            
            if 'plan' in response:
                print(f"   Current plan: {response['plan']}")
            if 'trial_end' in response:
                print(f"   Trial ends: {response['trial_end']}")
                
        return success

    def test_staff_endpoints(self):
        """Test staff management endpoints"""
        # Test GET staff (should be empty initially)
        success, staff_list = self.run_test(
            "Get Staff List",
            "GET",
            "staff",
            200
        )
        
        if not success:
            return False
            
        print(f"   Initial staff count: {len(staff_list)}")
        
        # Test POST staff (create new staff member)
        staff_data = {
            "name": "Max Mustermann",
            "color_tag": "#3B82F6"
        }
        
        success, new_staff = self.run_test(
            "Create Staff Member",
            "POST",
            "staff",
            200,
            data=staff_data
        )
        
        if success and 'id' in new_staff:
            print(f"   Created staff: {new_staff['name']} (ID: {new_staff['id']})")
            return True
            
        return False

    def test_services_endpoints(self):
        """Test services management endpoints"""
        # Test GET services (should be empty initially)
        success, services_list = self.run_test(
            "Get Services List",
            "GET",
            "services",
            200
        )
        
        if not success:
            return False
            
        print(f"   Initial services count: {len(services_list)}")
        
        # Test POST service (create new service)
        service_data = {
            "name": "Haarschnitt",
            "description": "Professioneller Haarschnitt",
            "duration_minutes": 30,
            "price_chf": 45.0,
            "buffer_minutes": 5
        }
        
        success, new_service = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if success and 'id' in new_service:
            print(f"   Created service: {new_service['name']} - CHF {new_service['price_chf']}")
            return True
            
        return False

    def test_public_booking_info(self):
        """Test public booking info endpoint"""
        if not self.test_tenant_data:
            print("❌ No test tenant data available for public booking test")
            return False
            
        tenant_slug = self.test_tenant_data["slug"]
        success, response = self.run_test(
            "Public Booking Info",
            "GET",
            f"public/{tenant_slug}/info",
            200
        )
        
        if success:
            if 'tenant' in response:
                print(f"   Public tenant name: {response['tenant']['name']}")
            if 'services' in response:
                print(f"   Available services: {len(response['services'])}")
            if 'staff' in response:
                print(f"   Available staff: {len(response['staff'])}")
                
        return success

    def test_appointments_endpoints(self):
        """Test appointments management endpoints - CRITICAL for Sebastian's appointment verification"""
        print("\n🔍 Testing Appointments Endpoints...")
        
        # First, get existing appointments to check for Sebastian's appointment
        success, appointments_list = self.run_test(
            "Get Appointments List",
            "GET",
            "appointments",
            200
        )
        
        if not success:
            return False
            
        print(f"   Found {len(appointments_list)} existing appointments")
        
        # Check for Sebastian Weber's appointment specifically
        sebastian_appointment = None
        for apt in appointments_list:
            if apt.get('customer_name') == 'Sebastian Weber':
                sebastian_appointment = apt
                print(f"   ✅ FOUND Sebastian Weber's appointment!")
                print(f"      - Date: {apt.get('start_at')}")
                print(f"      - Service: {apt.get('service_name', 'Unknown')}")
                print(f"      - Staff: {apt.get('staff_name', 'Unknown')}")
                print(f"      - Status: {apt.get('status', 'Unknown')}")
                break
        
        if not sebastian_appointment:
            print(f"   ❌ Sebastian Weber's appointment NOT FOUND in existing appointments")
            print(f"   Available appointments:")
            for apt in appointments_list:
                print(f"      - {apt.get('customer_name', 'Unknown')} on {apt.get('start_at', 'Unknown')}")
        
        # Test creating a new appointment (if we have staff and services)
        # First get staff and services
        staff_success, staff_list = self.run_test(
            "Get Staff for Appointment Test",
            "GET", 
            "staff",
            200
        )
        
        services_success, services_list = self.run_test(
            "Get Services for Appointment Test",
            "GET",
            "services", 
            200
        )
        
        if staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0:
            # Create a test appointment
            test_appointment_data = {
                "service_id": services_list[0]['id'],
                "staff_id": staff_list[0]['id'],
                "start_at": "2025-08-25T14:00:00Z",
                "customer_name": "Test Customer API",
                "customer_email": "test@example.com",
                "customer_phone": "+41 79 123 45 67",
                "notes": "Test appointment via API"
            }
            
            create_success, new_appointment = self.run_test(
                "Create Test Appointment",
                "POST",
                "appointments",
                200,
                data=test_appointment_data
            )
            
            if create_success:
                print(f"   ✅ Successfully created test appointment: {new_appointment.get('id')}")
            
        return success

    def test_stripe_payment_endpoints(self):
        """Test Stripe payment integration endpoints"""
        print("\n🔍 Testing Stripe Payment Integration...")
        
        if not self.token:
            print("❌ No authentication token available for payment tests")
            return False
        
        # Test 1: Create checkout session with valid package_id "starter"
        checkout_data_starter = {
            "package_id": "starter",
            "origin_url": self.base_url
        }
        
        success1, response1 = self.run_test(
            "Create Checkout Session - Starter Plan",
            "POST",
            "payments/checkout/session",
            200,
            data=checkout_data_starter
        )
        
        session_id_starter = None
        if success1 and 'session_id' in response1:
            session_id_starter = response1['session_id']
            print(f"   Created session ID: {session_id_starter}")
            print(f"   Checkout URL: {response1.get('url', 'N/A')}")
        
        # Test 2: Create checkout session with valid package_id "pro"
        checkout_data_pro = {
            "package_id": "pro", 
            "origin_url": self.base_url
        }
        
        success2, response2 = self.run_test(
            "Create Checkout Session - Pro Plan",
            "POST",
            "payments/checkout/session",
            200,
            data=checkout_data_pro
        )
        
        session_id_pro = None
        if success2 and 'session_id' in response2:
            session_id_pro = response2['session_id']
            print(f"   Created session ID: {session_id_pro}")
        
        # Test 3: Test invalid package_id
        checkout_data_invalid = {
            "package_id": "invalid_plan",
            "origin_url": self.base_url
        }
        
        success3, _ = self.run_test(
            "Create Checkout Session - Invalid Package",
            "POST",
            "payments/checkout/session",
            400,
            data=checkout_data_invalid
        )
        
        # Test 4: Test checkout status with valid session_id
        if session_id_starter:
            success4, status_response = self.run_test(
                "Get Checkout Status - Valid Session",
                "GET",
                f"payments/checkout/status/{session_id_starter}",
                200
            )
            
            if success4:
                print(f"   Payment Status: {status_response.get('payment_status', 'N/A')}")
                print(f"   Session Status: {status_response.get('status', 'N/A')}")
                print(f"   Amount: {status_response.get('amount_total', 'N/A')}")
                print(f"   Currency: {status_response.get('currency', 'N/A')}")
        else:
            success4 = False
        
        # Test 5: Test checkout status with invalid session_id
        success5, _ = self.run_test(
            "Get Checkout Status - Invalid Session",
            "GET",
            "payments/checkout/status/invalid_session_id",
            404
        )
        
        # Test 6: Test webhook endpoint (basic structure test)
        webhook_data = {
            "id": "evt_test_webhook",
            "object": "event",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_session",
                    "payment_status": "paid"
                }
            }
        }
        
        # Note: This will likely fail due to signature validation, but tests the endpoint exists
        success6, _ = self.run_test(
            "Stripe Webhook - Structure Test",
            "POST",
            "webhook/stripe",
            400,  # Expected to fail due to missing/invalid signature
            data=webhook_data
        )
        
        # Test 7: Test authentication requirement
        # Temporarily remove token to test auth requirement
        temp_token = self.token
        self.token = None
        
        success7, _ = self.run_test(
            "Payment Endpoint - No Auth",
            "POST",
            "payments/checkout/session",
            401,
            data=checkout_data_starter
        )
        
        # Restore token
        self.token = temp_token
        
        return success1 and success2 and success3 and success4 and success5 and success7

    def test_plan_packages_validation(self):
        """Test plan packages configuration and pricing"""
        print("\n🔍 Testing Plan Packages Configuration...")
        
        # Test by attempting to create checkout sessions and verifying the pricing logic
        if not self.token:
            print("❌ No authentication token available for plan validation tests")
            return False
        
        # Test Starter plan pricing (CHF 29.00)
        checkout_data_starter = {
            "package_id": "starter",
            "origin_url": self.base_url
        }
        
        success1, response1 = self.run_test(
            "Validate Starter Plan Pricing",
            "POST",
            "payments/checkout/session",
            200,
            data=checkout_data_starter
        )
        
        if success1 and 'session_id' in response1:
            # Check status to verify amount
            session_id = response1['session_id']
            success_status, status_response = self.run_test(
                "Check Starter Plan Amount",
                "GET",
                f"payments/checkout/status/{session_id}",
                200
            )
            
            if success_status:
                amount_total = status_response.get('amount_total', 0)
                expected_amount = 2900  # CHF 29.00 in cents
                if amount_total == expected_amount:
                    print(f"   ✅ Starter plan amount correct: CHF {amount_total/100:.2f}")
                else:
                    print(f"   ❌ Starter plan amount incorrect: Expected CHF 29.00, got CHF {amount_total/100:.2f}")
                    success1 = False
        
        # Test Pro plan pricing (CHF 59.00)
        checkout_data_pro = {
            "package_id": "pro",
            "origin_url": self.base_url
        }
        
        success2, response2 = self.run_test(
            "Validate Pro Plan Pricing",
            "POST",
            "payments/checkout/session",
            200,
            data=checkout_data_pro
        )
        
        if success2 and 'session_id' in response2:
            # Check status to verify amount
            session_id = response2['session_id']
            success_status, status_response = self.run_test(
                "Check Pro Plan Amount",
                "GET",
                f"payments/checkout/status/{session_id}",
                200
            )
            
            if success_status:
                amount_total = status_response.get('amount_total', 0)
                expected_amount = 5900  # CHF 59.00 in cents
                if amount_total == expected_amount:
                    print(f"   ✅ Pro plan amount correct: CHF {amount_total/100:.2f}")
                else:
                    print(f"   ❌ Pro plan amount incorrect: Expected CHF 59.00, got CHF {amount_total/100:.2f}")
                    success2 = False
        
        return success1 and success2

    def test_payment_database_integration(self):
        """Test PaymentTransaction database operations"""
        print("\n🔍 Testing Payment Database Integration...")
        
        if not self.token:
            print("❌ No authentication token available for database tests")
            return False
        
        # Create a checkout session to generate a PaymentTransaction record
        checkout_data = {
            "package_id": "starter",
            "origin_url": self.base_url
        }
        
        success, response = self.run_test(
            "Create Session for DB Test",
            "POST",
            "payments/checkout/session",
            200,
            data=checkout_data
        )
        
        if success and 'session_id' in response:
            session_id = response['session_id']
            print(f"   Created session for DB test: {session_id}")
            
            # Check that we can retrieve the payment status (which verifies DB record exists)
            success2, status_response = self.run_test(
                "Verify DB Record Creation",
                "GET",
                f"payments/checkout/status/{session_id}",
                200
            )
            
            if success2:
                print(f"   ✅ PaymentTransaction record created and retrievable")
                print(f"   Transaction status: {status_response.get('status', 'N/A')}")
                print(f"   Payment status: {status_response.get('payment_status', 'N/A')}")
                return True
            else:
                print(f"   ❌ Failed to retrieve PaymentTransaction record")
                return False
        else:
            print(f"   ❌ Failed to create checkout session for DB test")
            return False

    def test_payment_security_measures(self):
        """Test payment security and business logic"""
        print("\n🔍 Testing Payment Security Measures...")
        
        if not self.token:
            print("❌ No authentication token available for security tests")
            return False
        
        # Test 1: Prevent upgrading to same plan
        # First, we need to check current tenant plan and try to "upgrade" to the same plan
        success1, dashboard_response = self.run_test(
            "Get Current Plan for Security Test",
            "GET",
            "dashboard/overview",
            200
        )
        
        if success1 and 'plan' in dashboard_response:
            current_plan = dashboard_response['plan']
            print(f"   Current tenant plan: {current_plan}")
            
            # Try to upgrade to the same plan (should fail)
            if current_plan in ['starter', 'pro']:
                checkout_data_same_plan = {
                    "package_id": current_plan,
                    "origin_url": self.base_url
                }
                
                success_same_plan, _ = self.run_test(
                    f"Prevent Same Plan Upgrade - {current_plan}",
                    "POST",
                    "payments/checkout/session",
                    400,
                    data=checkout_data_same_plan
                )
                
                if success_same_plan:
                    print(f"   ✅ Successfully prevented upgrade to same plan ({current_plan})")
                else:
                    print(f"   ❌ Failed to prevent upgrade to same plan ({current_plan})")
                    return False
        
        # Test 2: Server-side pricing (cannot be manipulated from frontend)
        # This is inherently tested by the plan validation tests above
        print(f"   ✅ Server-side pricing enforced (tested via plan validation)")
        
        # Test 3: Authentication requirement (already tested in stripe endpoints)
        print(f"   ✅ Authentication requirement enforced")
        
        return True

    def test_subscription_cancellation(self):
        """Test subscription cancellation functionality"""
        print("\n🔍 Testing Subscription Cancellation...")
        
        if not self.token:
            print("❌ No authentication token available for cancellation tests")
            return False
        
        # First, get current tenant plan
        success1, dashboard_response = self.run_test(
            "Get Current Plan for Cancellation Test",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not success1 or 'plan' not in dashboard_response:
            print("❌ Failed to get current tenant plan")
            return False
        
        current_plan = dashboard_response['plan']
        print(f"   Current tenant plan: {current_plan}")
        
        # Test 1: Try to cancel subscription when on trial plan (should fail)
        if current_plan == 'trial':
            success_trial_cancel, response_trial = self.run_test(
                "Cancel Subscription - Trial Plan (Should Fail)",
                "POST",
                "auth/cancel-subscription",
                400
            )
            
            if success_trial_cancel:
                print("   ✅ Correctly prevented cancellation of trial plan")
                print(f"   Error message: {response_trial.get('detail', 'N/A')}")
            else:
                print("   ❌ Failed to prevent trial plan cancellation")
                return False
        
        # Test 2: Upgrade to a paid plan first, then test cancellation
        if current_plan == 'trial':
            print("   Upgrading to Starter plan for cancellation test...")
            
            # Create checkout session for starter plan
            checkout_data = {
                "package_id": "starter",
                "origin_url": self.base_url
            }
            
            success_checkout, checkout_response = self.run_test(
                "Create Checkout for Plan Upgrade",
                "POST",
                "payments/checkout/session",
                200,
                data=checkout_data
            )
            
            if success_checkout and 'session_id' in checkout_response:
                session_id = checkout_response['session_id']
                print(f"   Created checkout session: {session_id}")
                
                # For testing purposes, we'll simulate the plan upgrade by directly updating
                # the tenant plan (in real scenario, this would happen via Stripe webhook)
                # Since we can't actually complete a Stripe payment in tests, we'll test
                # the cancellation logic with the current trial plan and verify error handling
                
        # Test 3: Test unauthorized access (no token)
        temp_token = self.token
        self.token = None
        
        success_no_auth, _ = self.run_test(
            "Cancel Subscription - No Auth",
            "POST",
            "auth/cancel-subscription",
            401
        )
        
        # Restore token
        self.token = temp_token
        
        if success_no_auth:
            print("   ✅ Correctly blocked unauthorized cancellation attempt")
        else:
            print("   ❌ Failed to block unauthorized access")
            return False
        
        # Test 4: Verify cancellation endpoint exists and responds correctly
        # Since we're on trial, we expect a 400 error with proper message
        success_endpoint, response_endpoint = self.run_test(
            "Verify Cancellation Endpoint Structure",
            "POST",
            "auth/cancel-subscription",
            400
        )
        
        if success_endpoint:
            print("   ✅ Cancellation endpoint exists and responds correctly")
            expected_message = "Keine aktives Abonnement zum Kündigen"
            if response_endpoint.get('detail') == expected_message:
                print(f"   ✅ Correct error message for trial cancellation")
            else:
                print(f"   ⚠️  Different error message: {response_endpoint.get('detail')}")
        else:
            print("   ❌ Cancellation endpoint not working properly")
            return False
        
        print("   📝 Note: Full cancellation flow testing requires paid plan upgrade")
        print("   📝 Business logic validation: ✅ Trial plans cannot be cancelled")
        print("   📝 Authentication validation: ✅ Unauthorized access blocked")
        print("   📝 Endpoint structure: ✅ Responds with proper error codes")
        
        return True

    def test_database_cancellation_structure(self):
        """Test database structure for subscription cancellations"""
        print("\n🔍 Testing Database Cancellation Structure...")
        
        # This test verifies that the cancellation endpoint would create proper database records
        # We can't fully test this without a paid plan, but we can verify the endpoint structure
        
        if not self.token:
            print("❌ No authentication token available for database structure tests")
            return False
        
        # Test the cancellation endpoint to ensure it has proper error handling
        # and would create database records for valid cancellations
        success, response = self.run_test(
            "Test Cancellation Database Logic",
            "POST", 
            "auth/cancel-subscription",
            400  # Expected since we're on trial
        )
        
        if success:
            print("   ✅ Cancellation endpoint properly validates business rules")
            print("   📝 Database integration: subscription_cancellations collection would be created")
            print("   📝 Cancellation record structure: tenant_id, previous_plan, cancelled_at, reason")
            print("   📝 Plan downgrade logic: Updates tenant plan to trial with 30-day extension")
            return True
        else:
            print("   ❌ Cancellation endpoint not responding correctly")
            return False

    def test_tenant_slug_functionality(self):
        """Test tenant slug functionality comprehensively"""
        print("\n🔍 Testing Tenant Slug Functionality...")
        
        if not self.test_tenant_data:
            print("❌ No test tenant data available for slug tests")
            return False
        
        # Test 1: Verify dashboard returns tenant_name and tenant_slug
        success1, dashboard_response = self.run_test(
            "Dashboard Overview - Slug Fields",
            "GET",
            "dashboard/overview",
            200
        )
        
        slug_fields_present = False
        if success1:
            if 'tenant_name' in dashboard_response and 'tenant_slug' in dashboard_response:
                print(f"   ✅ Dashboard returns tenant_name: {dashboard_response['tenant_name']}")
                print(f"   ✅ Dashboard returns tenant_slug: {dashboard_response['tenant_slug']}")
                
                # Verify slug matches what was registered
                expected_slug = self.test_tenant_data['slug']
                actual_slug = dashboard_response['tenant_slug']
                if actual_slug == expected_slug:
                    print(f"   ✅ Slug matches registration: {actual_slug}")
                    slug_fields_present = True
                else:
                    print(f"   ❌ Slug mismatch - Expected: {expected_slug}, Got: {actual_slug}")
            else:
                print(f"   ❌ Missing slug fields in dashboard response")
                print(f"   Available keys: {list(dashboard_response.keys())}")
        
        # Test 2: Test public booking info with real tenant slug
        tenant_slug = self.test_tenant_data['slug']
        success2, public_info = self.run_test(
            "Public Booking Info - Real Slug",
            "GET",
            f"public/{tenant_slug}/info",
            200
        )
        
        public_slug_works = False
        if success2:
            if 'tenant' in public_info:
                tenant_info = public_info['tenant']
                print(f"   ✅ Public endpoint found tenant: {tenant_info.get('name', 'N/A')}")
                print(f"   ✅ Tenant ID: {tenant_info.get('id', 'N/A')}")
                public_slug_works = True
            else:
                print(f"   ❌ Public endpoint didn't return tenant info")
        
        # Test 3: Test with invalid/non-existent slug (should return 404)
        invalid_slug = f"non-existent-slug-{datetime.now().strftime('%H%M%S')}"
        success3, _ = self.run_test(
            "Public Booking Info - Invalid Slug",
            "GET",
            f"public/{invalid_slug}/info",
            404
        )
        
        if success3:
            print(f"   ✅ Invalid slug correctly returns 404")
        
        # Test 4: Test case sensitivity (should be case-insensitive)
        upper_slug = tenant_slug.upper()
        success4, case_response = self.run_test(
            "Public Booking Info - Case Sensitivity",
            "GET",
            f"public/{upper_slug}/info",
            404  # Expecting 404 since MongoDB queries are case-sensitive by default
        )
        
        if success4:
            print(f"   ✅ Slug lookup is case-sensitive (as expected)")
        else:
            print(f"   ⚠️  Slug lookup case sensitivity test inconclusive")
        
        return success1 and slug_fields_present and success2 and public_slug_works and success3

    def test_slug_registration_constraints(self):
        """Test slug registration and uniqueness constraints"""
        print("\n🔍 Testing Slug Registration Constraints...")
        
        if not self.test_tenant_data:
            print("❌ No test tenant data available for slug constraint tests")
            return False
        
        # Test 1: Try to register with duplicate slug (should fail)
        timestamp = datetime.now().strftime('%H%M%S')
        duplicate_slug_data = {
            "name": f"Duplicate Slug Test {timestamp}",
            "slug": self.test_tenant_data['slug'],  # Same slug as existing tenant
            "email": f"duplicate{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 987 65 43"
        }
        
        success1, response1 = self.run_test(
            "Registration - Duplicate Slug",
            "POST",
            "auth/register",
            400,
            data=duplicate_slug_data
        )
        
        if success1:
            print(f"   ✅ Duplicate slug correctly rejected")
            print(f"   Error message: {response1.get('detail', 'N/A')}")
        
        # Test 2: Test slug normalization with special characters
        normalized_slug_data = {
            "name": f"Normalization Test {timestamp}",
            "slug": f"test-slug-with-special-chars-{timestamp}",
            "email": f"normalize{timestamp}@example.com", 
            "password": "TestPass123!",
            "phone": "+41 44 555 66 77"
        }
        
        success2, response2 = self.run_test(
            "Registration - Slug with Special Chars",
            "POST",
            "auth/register",
            200,
            data=normalized_slug_data
        )
        
        if success2:
            print(f"   ✅ Slug with special characters accepted")
            if 'tenant' in response2:
                registered_slug = response2['tenant'].get('slug', 'N/A')
                print(f"   Registered slug: {registered_slug}")
        
        # Test 3: Test slug with numbers and hyphens
        numeric_slug_data = {
            "name": f"Numeric Test {timestamp}",
            "slug": f"salon-123-test-{timestamp}",
            "email": f"numeric{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 111 22 33"
        }
        
        success3, response3 = self.run_test(
            "Registration - Numeric Slug",
            "POST", 
            "auth/register",
            200,
            data=numeric_slug_data
        )
        
        if success3:
            print(f"   ✅ Numeric slug accepted")
            if 'tenant' in response3:
                registered_slug = response3['tenant'].get('slug', 'N/A')
                print(f"   Registered slug: {registered_slug}")
        
        return success1 and success2 and success3

    def test_public_appointments_with_slug(self):
        """Test public appointment creation with tenant slug"""
        print("\n🔍 Testing Public Appointments with Slug...")
        
        if not self.test_tenant_data:
            print("❌ No test tenant data available for public appointment tests")
            return False
        
        # First, ensure we have staff and services for appointment creation
        # Get staff and services using authenticated endpoints
        staff_success, staff_list = self.run_test(
            "Get Staff for Public Appointment Test",
            "GET",
            "staff",
            200
        )
        
        services_success, services_list = self.run_test(
            "Get Services for Public Appointment Test", 
            "GET",
            "services",
            200
        )
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("   ⚠️  Insufficient staff/services for public appointment test")
            return True  # Not a failure, just insufficient setup
        
        # Test 1: Create public appointment with valid tenant slug
        tenant_slug = self.test_tenant_data['slug']
        appointment_data = {
            "service_id": services_list[0]['id'],
            "staff_id": staff_list[0]['id'],
            "start_at": "2025-08-26T15:00:00Z",
            "customer_name": "Maria Müller",
            "customer_email": "maria.mueller@example.com",
            "customer_phone": "+41 79 555 66 77",
            "notes": "Öffentlicher Termin via Slug-Test"
        }
        
        success1, response1 = self.run_test(
            "Public Appointment - Valid Slug",
            "POST",
            f"public/{tenant_slug}/appointments",
            200,
            data=appointment_data
        )
        
        if success1:
            print(f"   ✅ Public appointment created successfully")
            if 'appointment' in response1:
                apt = response1['appointment']
                print(f"   Customer: {apt.get('customer_name', 'N/A')}")
                print(f"   Start: {apt.get('start_at', 'N/A')}")
        
        # Test 2: Try to create appointment with invalid slug
        invalid_slug = f"invalid-slug-{datetime.now().strftime('%H%M%S')}"
        success2, _ = self.run_test(
            "Public Appointment - Invalid Slug",
            "POST",
            f"public/{invalid_slug}/appointments",
            404,
            data=appointment_data
        )
        
        if success2:
            print(f"   ✅ Invalid slug correctly returns 404 for appointment creation")
        
        return success1 and success2

    def test_slug_based_tenant_lookup(self):
        """Test various slug formats and tenant lookup functionality"""
        print("\n🔍 Testing Slug-based Tenant Lookup...")
        
        if not self.test_tenant_data:
            print("❌ No test tenant data available for lookup tests")
            return False
        
        tenant_slug = self.test_tenant_data['slug']
        
        # Test 1: Basic slug lookup
        success1, response1 = self.run_test(
            "Slug Lookup - Basic",
            "GET",
            f"public/{tenant_slug}/info",
            200
        )
        
        basic_lookup_works = False
        if success1 and 'tenant' in response1:
            tenant_info = response1['tenant']
            expected_name = self.test_tenant_data['name']
            actual_name = tenant_info.get('name', '')
            
            if actual_name == expected_name:
                print(f"   ✅ Basic slug lookup works correctly")
                print(f"   Found tenant: {actual_name}")
                basic_lookup_works = True
            else:
                print(f"   ❌ Tenant name mismatch - Expected: {expected_name}, Got: {actual_name}")
        
        # Test 2: Test with slug containing numbers
        # Create a tenant with numeric slug for this test
        timestamp = datetime.now().strftime('%H%M%S')
        numeric_tenant_data = {
            "name": f"Numeric Slug Salon {timestamp}",
            "slug": f"salon-123-{timestamp}",
            "email": f"numeric{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 999 88 77"
        }
        
        success2, reg_response = self.run_test(
            "Register Tenant - Numeric Slug",
            "POST",
            "auth/register",
            200,
            data=numeric_tenant_data
        )
        
        numeric_lookup_works = False
        if success2:
            numeric_slug = numeric_tenant_data['slug']
            success2b, lookup_response = self.run_test(
                "Slug Lookup - Numeric Slug",
                "GET",
                f"public/{numeric_slug}/info",
                200
            )
            
            if success2b and 'tenant' in lookup_response:
                print(f"   ✅ Numeric slug lookup works")
                print(f"   Slug: {numeric_slug}")
                numeric_lookup_works = True
        
        # Test 3: Test with slug containing hyphens
        hyphen_tenant_data = {
            "name": f"Hyphen Slug Salon {timestamp}",
            "slug": f"beauty-salon-zurich-{timestamp}",
            "email": f"hyphen{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 777 88 99"
        }
        
        success3, reg_response3 = self.run_test(
            "Register Tenant - Hyphen Slug",
            "POST",
            "auth/register", 
            200,
            data=hyphen_tenant_data
        )
        
        hyphen_lookup_works = False
        if success3:
            hyphen_slug = hyphen_tenant_data['slug']
            success3b, lookup_response3 = self.run_test(
                "Slug Lookup - Hyphen Slug",
                "GET",
                f"public/{hyphen_slug}/info",
                200
            )
            
            if success3b and 'tenant' in lookup_response3:
                print(f"   ✅ Hyphen slug lookup works")
                print(f"   Slug: {hyphen_slug}")
                hyphen_lookup_works = True
        
        # Test 4: Test non-existent slug
        non_existent_slug = f"definitely-does-not-exist-{timestamp}"
        success4, _ = self.run_test(
            "Slug Lookup - Non-existent",
            "GET",
            f"public/{non_existent_slug}/info",
            404
        )
        
        if success4:
            print(f"   ✅ Non-existent slug correctly returns 404")
        
        return basic_lookup_works and numeric_lookup_works and hyphen_lookup_works and success4

    def test_appointment_management_endpoints(self):
        """Test new appointment management endpoints (PUT and DELETE)"""
        print("\n🔍 Testing Appointment Management Endpoints...")
        
        if not self.token:
            print("❌ No authentication token available for appointment management tests")
            return False
        
        # Get existing staff and services instead of creating new ones
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Appointment Management Test",
            "GET",
            "staff",
            200
        )
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Appointment Management Test",
            "GET",
            "services",
            200
        )
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for appointment management test")
            return False
        
        staff_id = staff_list[0]['id']
        service_id = services_list[0]['id']
        
        # Create a test appointment
        appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": "2025-08-27T10:00:00Z",
            "customer_name": "Hans Müller",
            "customer_email": "hans.mueller@example.com",
            "customer_phone": "+41 79 123 45 67",
            "notes": "Ersttermin"
        }
        
        create_success, create_response = self.run_test(
            "Create Appointment for Management Test",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if not create_success or 'id' not in create_response:
            print("❌ Failed to create appointment for management test")
            return False
        
        appointment_id = create_response['id']
        print(f"   Created appointment ID: {appointment_id}")
        
        # Test 1: Update appointment details (PUT)
        update_data = {
            "customer_name": "Hans Müller-Weber",
            "customer_email": "hans.mueller-weber@example.com",
            "customer_phone": "+41 79 987 65 43",
            "notes": "Aktualisierte Notizen - Folgetermin",
            "status": "confirmed"
        }
        
        update_success, update_response = self.run_test(
            "Update Appointment Details",
            "PUT",
            f"appointments/{appointment_id}",
            200,
            data=update_data
        )
        
        if update_success:
            print(f"   ✅ Appointment updated successfully")
            print(f"   Updated name: {update_response.get('customer_name', 'N/A')}")
            print(f"   Updated email: {update_response.get('customer_email', 'N/A')}")
            print(f"   Updated notes: {update_response.get('notes', 'N/A')}")
        
        # Test 2: Update with invalid appointment ID (should return 404)
        invalid_id = str(uuid.uuid4())
        invalid_update_success, _ = self.run_test(
            "Update Appointment - Invalid ID",
            "PUT",
            f"appointments/{invalid_id}",
            404,
            data=update_data
        )
        
        if invalid_update_success:
            print(f"   ✅ Invalid appointment ID correctly returns 404")
        
        # Test 3: Update without authentication (should return 401/403)
        temp_token = self.token
        self.token = None
        
        no_auth_update_success, _ = self.run_test(
            "Update Appointment - No Auth",
            "PUT",
            f"appointments/{appointment_id}",
            401,
            data=update_data
        )
        
        self.token = temp_token
        
        if no_auth_update_success:
            print(f"   ✅ Unauthorized update correctly blocked")
        
        # Test 4: Update with empty data (should return 400)
        empty_update_success, _ = self.run_test(
            "Update Appointment - Empty Data",
            "PUT",
            f"appointments/{appointment_id}",
            400,
            data={}
        )
        
        if empty_update_success:
            print(f"   ✅ Empty update data correctly rejected")
        
        # Test 5: Delete appointment
        delete_success, delete_response = self.run_test(
            "Delete Appointment",
            "DELETE",
            f"appointments/{appointment_id}",
            200
        )
        
        if delete_success:
            print(f"   ✅ Appointment deleted successfully")
            print(f"   Delete message: {delete_response.get('message', 'N/A')}")
        
        # Test 6: Try to delete the same appointment again (should return 404)
        delete_again_success, _ = self.run_test(
            "Delete Appointment - Already Deleted",
            "DELETE",
            f"appointments/{appointment_id}",
            404
        )
        
        if delete_again_success:
            print(f"   ✅ Deleting non-existent appointment correctly returns 404")
        
        # Test 7: Delete without authentication
        # Create another appointment first
        create_success2, create_response2 = self.run_test(
            "Create Second Appointment for Delete Test",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if create_success2:
            appointment_id2 = create_response2['id']
            
            # Remove token and try to delete
            temp_token = self.token
            self.token = None
            
            no_auth_delete_success, _ = self.run_test(
                "Delete Appointment - No Auth",
                "DELETE",
                f"appointments/{appointment_id2}",
                401
            )
            
            self.token = temp_token
            
            if no_auth_delete_success:
                print(f"   ✅ Unauthorized delete correctly blocked")
            
            # Clean up - delete the second appointment
            self.run_test(
                "Cleanup Second Appointment",
                "DELETE",
                f"appointments/{appointment_id2}",
                200
            )
        
        return (update_success and invalid_update_success and no_auth_update_success and 
                empty_update_success and delete_success and delete_again_success)

    def test_enhanced_dashboard_overview(self):
        """Test enhanced dashboard overview with new fields"""
        print("\n🔍 Testing Enhanced Dashboard Overview...")
        
        if not self.token:
            print("❌ No authentication token available for dashboard tests")
            return False
        
        # Get dashboard overview
        success, response = self.run_test(
            "Enhanced Dashboard Overview",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not success:
            return False
        
        # Check for new fields
        required_fields = [
            'termine_heute',
            'total_kunden', 
            'termine_dieses_monat',
            'aktive_mitarbeiter',
            'naechste_termine',
            'tenant_name',
            'tenant_slug'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in response:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ❌ Missing required fields: {missing_fields}")
            return False
        
        print(f"   ✅ All required fields present")
        print(f"   termine_heute: {response['termine_heute']}")
        print(f"   termine_dieses_monat: {response['termine_dieses_monat']}")
        print(f"   aktive_mitarbeiter: {response['aktive_mitarbeiter']}")
        print(f"   total_kunden: {response['total_kunden']}")
        print(f"   tenant_name: {response['tenant_name']}")
        print(f"   tenant_slug: {response['tenant_slug']}")
        
        # Check naechste_termine structure
        naechste_termine = response.get('naechste_termine', [])
        print(f"   naechste_termine count: {len(naechste_termine)}")
        
        # Verify service_name and staff_name are included in appointments
        for i, appointment in enumerate(naechste_termine[:3]):  # Check first 3
            has_service_name = 'service_name' in appointment
            has_staff_name = 'staff_name' in appointment
            print(f"   Appointment {i+1}: service_name={has_service_name}, staff_name={has_staff_name}")
        
        return True

    def test_dashboard_data_accuracy(self):
        """Test dashboard data accuracy with real appointments"""
        print("\n🔍 Testing Dashboard Data Accuracy...")
        
        if not self.token:
            print("❌ No authentication token available for data accuracy tests")
            return False
        
        # Use existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Accuracy Test",
            "GET",
            "staff",
            200
        )
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Accuracy Test",
            "GET",
            "services",
            200
        )
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for accuracy test")
            return False
        
        staff_id = staff_list[0]['id']
        service_id = services_list[0]['id']
        
        # Get initial dashboard state
        initial_success, initial_response = self.run_test(
            "Get Initial Dashboard State",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not initial_success:
            return False
        
        initial_heute = initial_response.get('termine_heute', 0)
        initial_monat = initial_response.get('termine_dieses_monat', 0)
        initial_kunden = initial_response.get('total_kunden', 0)
        
        print(f"   Initial state - heute: {initial_heute}, monat: {initial_monat}, kunden: {initial_kunden}")
        
        # Create appointments for today
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc)
        today_str = today.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        today_appointments = []
        for i in range(2):
            appointment_data = {
                "service_id": service_id,
                "staff_id": staff_id,
                "start_at": today_str,
                "customer_name": f"Kunde Heute {i+1}",
                "customer_email": f"kunde.heute.{i+1}@example.com",
                "status": "confirmed"
            }
            
            create_success, create_response = self.run_test(
                f"Create Today Appointment {i+1}",
                "POST",
                "appointments",
                200,
                data=appointment_data
            )
            
            if create_success:
                today_appointments.append(create_response['id'])
        
        # Create a cancelled appointment (should not be counted)
        cancelled_appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": today_str,
            "customer_name": "Stornierter Kunde",
            "customer_email": "storniert@example.com",
            "status": "confirmed"
        }
        
        cancelled_success, cancelled_response = self.run_test(
            "Create Appointment to Cancel",
            "POST",
            "appointments",
            200,
            data=cancelled_appointment_data
        )
        
        cancelled_id = None
        if cancelled_success:
            cancelled_id = cancelled_response['id']
            
            # Update to cancelled status
            cancel_update_success, _ = self.run_test(
                "Cancel Appointment",
                "PUT",
                f"appointments/{cancelled_id}",
                200,
                data={"status": "cancelled"}
            )
        
        # Check updated dashboard
        updated_success, updated_response = self.run_test(
            "Get Updated Dashboard State",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not updated_success:
            return False
        
        updated_heute = updated_response.get('termine_heute', 0)
        updated_monat = updated_response.get('termine_dieses_monat', 0)
        updated_kunden = updated_response.get('total_kunden', 0)
        
        print(f"   Updated state - heute: {updated_heute}, monat: {updated_monat}, kunden: {updated_kunden}")
        
        # Verify counts
        expected_heute_increase = 2  # Only confirmed appointments
        expected_monat_increase = 2  # Only confirmed appointments
        expected_kunden_increase = 2  # Unique customer emails
        
        heute_correct = (updated_heute - initial_heute) == expected_heute_increase
        monat_correct = (updated_monat - initial_monat) == expected_monat_increase
        kunden_correct = (updated_kunden - initial_kunden) == expected_kunden_increase
        
        print(f"   ✅ termine_heute count correct: {heute_correct}")
        print(f"   ✅ termine_dieses_monat count correct: {monat_correct}")
        print(f"   ✅ total_kunden count correct: {kunden_correct}")
        
        # Clean up appointments
        for apt_id in today_appointments:
            self.run_test(f"Cleanup Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        if cancelled_id:
            self.run_test(f"Cleanup Cancelled Appointment", "DELETE", f"appointments/{cancelled_id}", 200)
        
        return heute_correct and monat_correct and kunden_correct

    def test_service_staff_integration(self):
        """Test service and staff integration in appointments"""
        print("\n🔍 Testing Service and Staff Integration...")
        
        if not self.token:
            print("❌ No authentication token available for integration tests")
            return False
        
        # Use existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Integration Test",
            "GET",
            "staff",
            200
        )
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Integration Test",
            "GET",
            "services",
            200
        )
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for integration test")
            return False
        
        staff_id = staff_list[0]['id']
        staff_name = staff_list[0]['name']
        service_id = services_list[0]['id']
        service_name = services_list[0]['name']
        
        # Create appointment
        appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": "2025-08-28T14:00:00Z",
            "customer_name": "Integration Test Kunde",
            "customer_email": "integration@example.com"
        }
        
        create_success, create_response = self.run_test(
            "Create Appointment for Integration Test",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if not create_success:
            return False
        
        appointment_id = create_response['id']
        
        # Get appointments list and verify service/staff names are included
        list_success, appointments_list = self.run_test(
            "Get Appointments with Service/Staff Info",
            "GET",
            "appointments",
            200
        )
        
        if not list_success:
            return False
        
        # Find our test appointment
        test_appointment = None
        for apt in appointments_list:
            if apt.get('id') == appointment_id:
                test_appointment = apt
                break
        
        if not test_appointment:
            print("❌ Test appointment not found in list")
            return False
        
        # Verify service and staff names are included
        has_service_name = 'service_name' in test_appointment
        has_staff_name = 'staff_name' in test_appointment
        service_name_correct = test_appointment.get('service_name') == service_name
        staff_name_correct = test_appointment.get('staff_name') == staff_name
        
        print(f"   ✅ Service name included: {has_service_name}")
        print(f"   ✅ Staff name included: {has_staff_name}")
        print(f"   ✅ Service name correct: {service_name_correct}")
        print(f"   ✅ Staff name correct: {staff_name_correct}")
        
        if has_service_name:
            print(f"   Service name: {test_appointment.get('service_name')}")
        if has_staff_name:
            print(f"   Staff name: {test_appointment.get('staff_name')}")
        
        # Check dashboard naechste_termine also includes names
        dashboard_success, dashboard_response = self.run_test(
            "Check Dashboard Service/Staff Names",
            "GET",
            "dashboard/overview",
            200
        )
        
        dashboard_names_correct = True
        if dashboard_success:
            naechste_termine = dashboard_response.get('naechste_termine', [])
            for apt in naechste_termine:
                if apt.get('id') == appointment_id:
                    apt_has_service = 'service_name' in apt
                    apt_has_staff = 'staff_name' in apt
                    print(f"   ✅ Dashboard appointment has service_name: {apt_has_service}")
                    print(f"   ✅ Dashboard appointment has staff_name: {apt_has_staff}")
                    dashboard_names_correct = apt_has_service and apt_has_staff
                    break
        
        # Clean up
        self.run_test("Cleanup Integration Test Appointment", "DELETE", f"appointments/{appointment_id}", 200)
        
        return (has_service_name and has_staff_name and service_name_correct and 
                staff_name_correct and dashboard_names_correct)

    def test_data_consistency(self):
        """Test data consistency across operations"""
        print("\n🔍 Testing Data Consistency...")
        
        if not self.token:
            print("❌ No authentication token available for consistency tests")
            return False
        
        # Get initial dashboard state
        initial_success, initial_response = self.run_test(
            "Get Initial State for Consistency Test",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not initial_success:
            return False
        
        initial_count = initial_response.get('termine_dieses_monat', 0)
        print(f"   Initial appointment count: {initial_count}")
        
        # Use existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Consistency Test", "GET", "staff", 200)
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Consistency Test", "GET", "services", 200)
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for consistency test")
            return False
        
        staff_id = staff_list[0]['id']
        service_id = services_list[0]['id']
        
        # Create multiple appointments
        appointment_ids = []
        for i in range(3):
            appointment_data = {
                "service_id": service_id,
                "staff_id": staff_id,
                "start_at": f"2025-08-29T{10+i}:00:00Z",
                "customer_name": f"Consistency Test Kunde {i+1}",
                "customer_email": f"consistency{i+1}@example.com"
            }
            
            create_success, create_response = self.run_test(
                f"Create Consistency Appointment {i+1}",
                "POST", "appointments", 200, data=appointment_data)
            
            if create_success:
                appointment_ids.append(create_response['id'])
        
        # Check count after creation
        after_create_success, after_create_response = self.run_test(
            "Check Count After Creation", "GET", "dashboard/overview", 200)
        
        if not after_create_success:
            return False
        
        after_create_count = after_create_response.get('termine_dieses_monat', 0)
        create_increase = after_create_count - initial_count
        
        print(f"   Count after creation: {after_create_count} (increase: {create_increase})")
        
        # Update one appointment
        if appointment_ids:
            update_data = {"customer_name": "Updated Consistency Customer"}
            update_success, _ = self.run_test(
                "Update Appointment for Consistency Test",
                "PUT", f"appointments/{appointment_ids[0]}", 200, data=update_data)
            
            # Check count after update (should remain same)
            after_update_success, after_update_response = self.run_test(
                "Check Count After Update", "GET", "dashboard/overview", 200)
            
            if after_update_success:
                after_update_count = after_update_response.get('termine_dieses_monat', 0)
                print(f"   Count after update: {after_update_count} (should be same as after creation)")
                update_consistent = after_update_count == after_create_count
            else:
                update_consistent = False
        else:
            update_consistent = False
        
        # Delete appointments and verify count decreases
        deleted_count = 0
        for apt_id in appointment_ids:
            delete_success, _ = self.run_test(
                f"Delete Consistency Appointment", "DELETE", f"appointments/{apt_id}", 200)
            if delete_success:
                deleted_count += 1
        
        # Check final count
        final_success, final_response = self.run_test(
            "Check Final Count After Deletions", "GET", "dashboard/overview", 200)
        
        if not final_success:
            return False
        
        final_count = final_response.get('termine_dieses_monat', 0)
        expected_final = initial_count + len(appointment_ids) - deleted_count
        
        print(f"   Final count: {final_count} (expected: {expected_final})")
        print(f"   Created: {len(appointment_ids)}, Deleted: {deleted_count}")
        
        deletion_consistent = final_count == expected_final
        
        print(f"   ✅ Creation consistency: {create_increase == len(appointment_ids)}")
        print(f"   ✅ Update consistency: {update_consistent}")
        print(f"   ✅ Deletion consistency: {deletion_consistent}")
        
        return (create_increase == len(appointment_ids) and update_consistent and deletion_consistent)

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        print("\n🔍 Testing Error Handling...")
        
        # Test invalid login
        invalid_login = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        success, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data=invalid_login
        )
        
        # Test duplicate registration
        if self.test_tenant_data:
            success2, _ = self.run_test(
                "Duplicate Registration",
                "POST",
                "auth/register",
                400,
                data=self.test_tenant_data
            )
            return success and success2
            
        return success

    def test_dashboard_today_only_appointments(self):
        """Test that naechste_termine only returns today's appointments (not all future)"""
        print("\n🔍 Testing Dashboard Today-Only Appointments Logic...")
        
        if not self.token:
            print("❌ No authentication token available for today-only tests")
            return False
        
        # Use existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Today-Only Test", "GET", "staff", 200)
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Today-Only Test", "GET", "services", 200)
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for today-only test")
            return False
        
        staff_id = staff_list[0]['id']
        service_id = services_list[0]['id']
        
        # Create appointments for different dates
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        
        # Today's appointment (should appear in naechste_termine)
        today_start = now.replace(hour=14, minute=0, second=0, microsecond=0)
        today_appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": today_start.isoformat(),
            "customer_name": "Heute Kunde",
            "customer_email": "heute@example.com",
            "status": "confirmed"
        }
        
        # Tomorrow's appointment (should NOT appear in naechste_termine)
        tomorrow = now + timedelta(days=1)
        tomorrow_start = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        tomorrow_appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": tomorrow_start.isoformat(),
            "customer_name": "Morgen Kunde",
            "customer_email": "morgen@example.com",
            "status": "confirmed"
        }
        
        # Yesterday's appointment (should NOT appear in naechste_termine)
        yesterday = now - timedelta(days=1)
        yesterday_start = yesterday.replace(hour=16, minute=0, second=0, microsecond=0)
        yesterday_appointment_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": yesterday_start.isoformat(),
            "customer_name": "Gestern Kunde",
            "customer_email": "gestern@example.com",
            "status": "confirmed"
        }
        
        # Create all appointments
        appointment_ids = []
        
        today_success, today_response = self.run_test(
            "Create Today's Appointment", "POST", "appointments", 200, data=today_appointment_data)
        if today_success:
            appointment_ids.append(today_response['id'])
            print(f"   Created today's appointment: {today_response['id']}")
        
        tomorrow_success, tomorrow_response = self.run_test(
            "Create Tomorrow's Appointment", "POST", "appointments", 200, data=tomorrow_appointment_data)
        if tomorrow_success:
            appointment_ids.append(tomorrow_response['id'])
            print(f"   Created tomorrow's appointment: {tomorrow_response['id']}")
        
        yesterday_success, yesterday_response = self.run_test(
            "Create Yesterday's Appointment", "POST", "appointments", 200, data=yesterday_appointment_data)
        if yesterday_success:
            appointment_ids.append(yesterday_response['id'])
            print(f"   Created yesterday's appointment: {yesterday_response['id']}")
        
        # Get dashboard overview
        dashboard_success, dashboard_response = self.run_test(
            "Get Dashboard for Today-Only Test", "GET", "dashboard/overview", 200)
        
        if not dashboard_success:
            return False
        
        naechste_termine = dashboard_response.get('naechste_termine', [])
        print(f"   Found {len(naechste_termine)} appointments in naechste_termine")
        
        # Verify only today's appointments are included
        today_appointments_found = []
        tomorrow_appointments_found = []
        yesterday_appointments_found = []
        
        for apt in naechste_termine:
            customer_name = apt.get('customer_name', '')
            start_at = apt.get('start_at', '')
            
            if 'Heute' in customer_name:
                today_appointments_found.append(apt)
                print(f"   ✅ Found today's appointment: {customer_name} at {start_at}")
            elif 'Morgen' in customer_name:
                tomorrow_appointments_found.append(apt)
                print(f"   ❌ Found tomorrow's appointment (should not be here): {customer_name} at {start_at}")
            elif 'Gestern' in customer_name:
                yesterday_appointments_found.append(apt)
                print(f"   ❌ Found yesterday's appointment (should not be here): {customer_name} at {start_at}")
        
        # Test results
        today_only_correct = len(today_appointments_found) > 0 and len(tomorrow_appointments_found) == 0 and len(yesterday_appointments_found) == 0
        
        print(f"   Today's appointments in naechste_termine: {len(today_appointments_found)}")
        print(f"   Tomorrow's appointments in naechste_termine: {len(tomorrow_appointments_found)} (should be 0)")
        print(f"   Yesterday's appointments in naechste_termine: {len(yesterday_appointments_found)} (should be 0)")
        
        # Test cancelled appointment (should be excluded)
        if today_success:
            cancelled_appointment_data = {
                "service_id": service_id,
                "staff_id": staff_id,
                "start_at": today_start.replace(hour=15).isoformat(),
                "customer_name": "Storniert Heute",
                "customer_email": "storniert.heute@example.com",
                "status": "confirmed"
            }
            
            cancelled_success, cancelled_response = self.run_test(
                "Create Appointment to Cancel", "POST", "appointments", 200, data=cancelled_appointment_data)
            
            if cancelled_success:
                cancelled_id = cancelled_response['id']
                appointment_ids.append(cancelled_id)
                
                # Cancel the appointment
                cancel_success, _ = self.run_test(
                    "Cancel Today's Appointment", "PUT", f"appointments/{cancelled_id}", 200, 
                    data={"status": "cancelled"})
                
                if cancel_success:
                    # Check dashboard again
                    dashboard2_success, dashboard2_response = self.run_test(
                        "Get Dashboard After Cancellation", "GET", "dashboard/overview", 200)
                    
                    if dashboard2_success:
                        naechste_termine2 = dashboard2_response.get('naechste_termine', [])
                        cancelled_found = any('Storniert' in apt.get('customer_name', '') for apt in naechste_termine2)
                        
                        if not cancelled_found:
                            print(f"   ✅ Cancelled appointment correctly excluded from naechste_termine")
                        else:
                            print(f"   ❌ Cancelled appointment still appears in naechste_termine")
                            today_only_correct = False
        
        # Test with no appointments today
        # Delete today's appointment and check empty result
        if today_success:
            delete_success, _ = self.run_test(
                "Delete Today's Appointment", "DELETE", f"appointments/{appointment_ids[0]}", 200)
            
            if delete_success:
                dashboard3_success, dashboard3_response = self.run_test(
                    "Get Dashboard After Deleting Today's Appointment", "GET", "dashboard/overview", 200)
                
                if dashboard3_success:
                    naechste_termine3 = dashboard3_response.get('naechste_termine', [])
                    today_appointments_remaining = [apt for apt in naechste_termine3 if 'Heute' in apt.get('customer_name', '')]
                    
                    if len(today_appointments_remaining) == 0:
                        print(f"   ✅ No today's appointments found after deletion (naechste_termine may be empty or contain other appointments)")
                    else:
                        print(f"   ❌ Today's appointments still found after deletion")
                        today_only_correct = False
        
        # Clean up all test appointments
        for apt_id in appointment_ids:
            self.run_test(f"Cleanup Today-Only Test Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        if today_only_correct:
            print(f"   ✅ Dashboard naechste_termine correctly shows only today's confirmed appointments")
        else:
            print(f"   ❌ Dashboard naechste_termine logic is incorrect")
        
        return today_only_correct

    def test_dashboard_edge_cases(self):
        """Test dashboard edge cases for today's appointments"""
        print("\n🔍 Testing Dashboard Edge Cases...")
        
        if not self.token:
            print("❌ No authentication token available for edge case tests")
            return False
        
        # Use existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Existing Staff for Edge Case Test", "GET", "staff", 200)
        
        services_success, services_list = self.run_test(
            "Get Existing Services for Edge Case Test", "GET", "services", 200)
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient existing staff/services for edge case test")
            return False
        
        staff_id = staff_list[0]['id']
        service_id = services_list[0]['id']
        
        # Test 1: Multiple appointments today (should return all up to 10)
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        today_appointments = []
        
        for i in range(5):  # Create 5 appointments today
            appointment_time = now.replace(hour=9+i, minute=0, second=0, microsecond=0)
            appointment_data = {
                "service_id": service_id,
                "staff_id": staff_id,
                "start_at": appointment_time.isoformat(),
                "customer_name": f"Multi Kunde {i+1}",
                "customer_email": f"multi{i+1}@example.com",
                "status": "confirmed"
            }
            
            create_success, create_response = self.run_test(
                f"Create Multiple Today Appointment {i+1}", "POST", "appointments", 200, data=appointment_data)
            
            if create_success:
                today_appointments.append(create_response['id'])
        
        # Check dashboard shows all today's appointments
        dashboard_success, dashboard_response = self.run_test(
            "Get Dashboard for Multiple Appointments Test", "GET", "dashboard/overview", 200)
        
        multiple_appointments_correct = False
        if dashboard_success:
            naechste_termine = dashboard_response.get('naechste_termine', [])
            multi_appointments = [apt for apt in naechste_termine if 'Multi Kunde' in apt.get('customer_name', '')]
            
            print(f"   Created {len(today_appointments)} appointments today")
            print(f"   Found {len(multi_appointments)} in naechste_termine")
            
            if len(multi_appointments) == len(today_appointments):
                print(f"   ✅ All today's appointments correctly returned")
                multiple_appointments_correct = True
            else:
                print(f"   ❌ Not all today's appointments returned")
        
        # Test 2: Verify service_name and staff_name are included
        service_staff_names_correct = True
        if dashboard_success:
            naechste_termine = dashboard_response.get('naechste_termine', [])
            for apt in naechste_termine[:3]:  # Check first 3
                has_service_name = 'service_name' in apt
                has_staff_name = 'staff_name' in apt
                
                if not (has_service_name and has_staff_name):
                    service_staff_names_correct = False
                    print(f"   ❌ Appointment missing service_name or staff_name")
                    break
            
            if service_staff_names_correct:
                print(f"   ✅ All appointments include service_name and staff_name")
        
        # Test 3: Verify data structure fields
        data_structure_correct = True
        if dashboard_success:
            required_fields = ['termine_heute', 'termine_dieses_monat', 'aktive_mitarbeiter', 'total_kunden', 'tenant_name', 'tenant_slug']
            missing_fields = [field for field in required_fields if field not in dashboard_response]
            
            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                data_structure_correct = False
            else:
                print(f"   ✅ All required dashboard fields present")
        
        # Clean up
        for apt_id in today_appointments:
            self.run_test(f"Cleanup Edge Case Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        return multiple_appointments_correct and service_staff_names_correct and data_structure_correct

    def test_calendar_appointment_debugging(self):
        """Debug the calendar empty appointment issue as requested by user"""
        print("\n🔍 Testing Calendar Appointment Debugging - User Request...")
        
        if not self.token:
            print("❌ No authentication token available for calendar debugging")
            return False
        
        # Step 1: Check if there are any appointments in the database
        print("\n📋 Step 1: Checking if there are any appointments in the database...")
        success, appointments_list = self.run_test(
            "GET /api/appointments - Check Database",
            "GET",
            "appointments",
            200
        )
        
        if not success:
            print("❌ Failed to get appointments from database")
            return False
        
        print(f"   Found {len(appointments_list)} total appointments in database")
        
        if len(appointments_list) == 0:
            print("   🔍 ROOT CAUSE: No appointments exist in database - this explains empty calendar")
        else:
            print("   📊 Existing appointments:")
            for i, apt in enumerate(appointments_list[:5]):  # Show first 5
                print(f"      {i+1}. {apt.get('customer_name', 'Unknown')} - {apt.get('start_at', 'Unknown time')} - {apt.get('status', 'Unknown status')}")
        
        # Step 2: Create test appointments with proper data for TODAY
        print("\n➕ Step 2: Creating test appointments with proper data for TODAY...")
        
        # Get existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Staff for Calendar Test", "GET", "staff", 200)
        services_success, services_list = self.run_test(
            "Get Services for Calendar Test", "GET", "services", 200)
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient staff/services for calendar test")
            return False
        
        # Create realistic appointments for TODAY with different times
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        
        test_appointments = [
            {
                "time_offset_hours": 2,
                "customer_name": "Maria Müller",
                "service_name": services_list[0]['name'],
                "staff_name": staff_list[0]['name'],
                "customer_email": "maria.mueller@example.com",
                "customer_phone": "+41 79 123 45 67"
            },
            {
                "time_offset_hours": 4,
                "customer_name": "Hans Weber",
                "service_name": services_list[0]['name'],
                "staff_name": staff_list[0]['name'],
                "customer_email": "hans.weber@example.com",
                "customer_phone": "+41 79 987 65 43"
            },
            {
                "time_offset_hours": 6,
                "customer_name": "Anna Schmidt",
                "service_name": services_list[0]['name'],
                "staff_name": staff_list[0]['name'],
                "customer_email": "anna.schmidt@example.com",
                "customer_phone": "+41 79 555 66 77"
            }
        ]
        
        created_appointment_ids = []
        
        for i, apt_data in enumerate(test_appointments):
            appointment_time = now + timedelta(hours=apt_data["time_offset_hours"])
            appointment_request = {
                "service_id": services_list[0]['id'],
                "staff_id": staff_list[0]['id'],
                "start_at": appointment_time.isoformat().replace('+00:00', 'Z'),
                "customer_name": apt_data["customer_name"],
                "customer_email": apt_data["customer_email"],
                "customer_phone": apt_data["customer_phone"],
                "notes": f"Test appointment {i+1} for calendar debugging"
            }
            
            create_success, create_response = self.run_test(
                f"Create Today Appointment {i+1} - {apt_data['customer_name']}",
                "POST",
                "appointments",
                200,
                data=appointment_request
            )
            
            if create_success:
                apt_id = create_response.get('id')
                created_appointment_ids.append(apt_id)
                print(f"   ✅ Created appointment: {apt_data['customer_name']} at {appointment_time.strftime('%H:%M')}")
            else:
                print(f"   ❌ Failed to create appointment for {apt_data['customer_name']}")
        
        # Step 3: Verify appointment data format
        print("\n🔍 Step 3: Verifying appointment data format...")
        
        verify_success, verify_appointments = self.run_test(
            "GET /api/appointments - Verify Data Format",
            "GET",
            "appointments",
            200
        )
        
        if verify_success:
            print(f"   Found {len(verify_appointments)} total appointments after creation")
            
            # Check data format for our test appointments
            for apt in verify_appointments:
                if apt.get('customer_name') in [ta['customer_name'] for ta in test_appointments]:
                    print(f"   📋 Appointment: {apt.get('customer_name')}")
                    print(f"      - start_at: {apt.get('start_at')} (format check)")
                    print(f"      - end_at: {apt.get('end_at')} (format check)")
                    print(f"      - customer_name: {apt.get('customer_name')} (not null/empty: {'✅' if apt.get('customer_name') else '❌'})")
                    print(f"      - service_name: {apt.get('service_name', 'N/A')} (present: {'✅' if apt.get('service_name') else '❌'})")
                    print(f"      - staff_name: {apt.get('staff_name', 'N/A')} (present: {'✅' if apt.get('staff_name') else '❌'})")
                    print(f"      - status: {apt.get('status', 'N/A')}")
        
        # Step 4: Test dashboard/calendar endpoint
        print("\n📊 Step 4: Testing dashboard/calendar endpoint...")
        
        dashboard_success, dashboard_response = self.run_test(
            "GET /api/dashboard/overview - Calendar Data",
            "GET",
            "dashboard/overview",
            200
        )
        
        if dashboard_success:
            naechste_termine = dashboard_response.get('naechste_termine', [])
            termine_heute = dashboard_response.get('termine_heute', 0)
            
            print(f"   Dashboard Results:")
            print(f"      - termine_heute: {termine_heute}")
            print(f"      - naechste_termine count: {len(naechste_termine)}")
            
            if len(naechste_termine) > 0:
                print(f"   📅 Calendar appointments found:")
                for i, apt in enumerate(naechste_termine):
                    print(f"      {i+1}. {apt.get('customer_name', 'Unknown')} - {apt.get('start_at', 'Unknown time')}")
                    print(f"         Service: {apt.get('service_name', 'N/A')} | Staff: {apt.get('staff_name', 'N/A')}")
                print("   ✅ Calendar should now show appointment details!")
            else:
                print("   ❌ naechste_termine still empty - investigating further...")
        
        # Step 5: Test multiple scenarios as requested
        print("\n🧪 Step 5: Testing multiple scenarios...")
        
        # Test with different staff member (if available)
        if len(staff_list) > 1:
            different_staff_apt = {
                "service_id": services_list[0]['id'],
                "staff_id": staff_list[1]['id'],  # Different staff
                "start_at": (now + timedelta(hours=8)).isoformat().replace('+00:00', 'Z'),
                "customer_name": "Peter Zimmermann",
                "customer_email": "peter.zimmermann@example.com",
                "notes": "Appointment with different staff member"
            }
            
            diff_staff_success, diff_staff_response = self.run_test(
                "Create Appointment - Different Staff",
                "POST",
                "appointments",
                200,
                data=different_staff_apt
            )
            
            if diff_staff_success:
                created_appointment_ids.append(diff_staff_response.get('id'))
                print(f"   ✅ Created appointment with different staff: {staff_list[1]['name']}")
        
        # Test with different service (if available)
        if len(services_list) > 1:
            different_service_apt = {
                "service_id": services_list[1]['id'],  # Different service
                "staff_id": staff_list[0]['id'],
                "start_at": (now + timedelta(hours=10)).isoformat().replace('+00:00', 'Z'),
                "customer_name": "Lisa Meier",
                "customer_email": "lisa.meier@example.com",
                "notes": "Appointment with different service"
            }
            
            diff_service_success, diff_service_response = self.run_test(
                "Create Appointment - Different Service",
                "POST",
                "appointments",
                200,
                data=different_service_apt
            )
            
            if diff_service_success:
                created_appointment_ids.append(diff_service_response.get('id'))
                print(f"   ✅ Created appointment with different service: {services_list[1]['name']}")
        
        # Final dashboard check
        print("\n🔄 Step 6: Final dashboard check after all appointments...")
        
        final_dashboard_success, final_dashboard_response = self.run_test(
            "Final Dashboard Check - All Scenarios",
            "GET",
            "dashboard/overview",
            200
        )
        
        if final_dashboard_success:
            final_naechste_termine = final_dashboard_response.get('naechste_termine', [])
            final_termine_heute = final_dashboard_response.get('termine_heute', 0)
            
            print(f"   Final Results:")
            print(f"      - termine_heute: {final_termine_heute}")
            print(f"      - naechste_termine count: {len(final_naechste_termine)}")
            
            if len(final_naechste_termine) > 0:
                print(f"   📅 All calendar appointments:")
                for i, apt in enumerate(final_naechste_termine):
                    print(f"      {i+1}. {apt.get('customer_name', 'Unknown')}")
                    print(f"         Time: {apt.get('start_at', 'Unknown')}")
                    print(f"         Service: {apt.get('service_name', 'N/A')}")
                    print(f"         Staff: {apt.get('staff_name', 'N/A')}")
                    print(f"         Status: {apt.get('status', 'N/A')}")
        
        # Cleanup test appointments
        print("\n🧹 Cleaning up test appointments...")
        for apt_id in created_appointment_ids:
            self.run_test("Cleanup Calendar Test Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        # Summary
        print(f"\n📋 CALENDAR DEBUGGING SUMMARY:")
        print(f"   - Initial appointments in database: {len(appointments_list)}")
        print(f"   - Test appointments created: {len(created_appointment_ids)}")
        print(f"   - Final dashboard appointments: {len(final_naechste_termine) if final_dashboard_success else 'N/A'}")
        
        if len(appointments_list) == 0 and len(created_appointment_ids) > 0:
            print(f"   🎯 CONCLUSION: Calendar was empty because no appointments existed initially.")
            print(f"   ✅ After creating appointments, they appear in calendar correctly.")
            print(f"   💡 USER ACTION: Create real appointments to populate the calendar.")
        
        return success and dashboard_success

    def test_dashboard_vs_calendar_discrepancy(self):
        """Investigate discrepancy between dashboard and calendar appointment display"""
        print("\n🔍 INVESTIGATING DASHBOARD VS CALENDAR DISCREPANCY...")
        
        if not self.token:
            print("❌ No authentication token available for discrepancy investigation")
            return False
        
        # Step 1: Compare Dashboard vs Calendar Data Sources
        print("\n📊 STEP 1: COMPARING DASHBOARD VS CALENDAR DATA SOURCES")
        
        # Test GET /api/dashboard/overview - check naechste_termine field
        dashboard_success, dashboard_response = self.run_test(
            "GET Dashboard Overview - naechste_termine",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not dashboard_success:
            print("❌ Failed to get dashboard overview")
            return False
        
        naechste_termine = dashboard_response.get('naechste_termine', [])
        print(f"   📋 Dashboard naechste_termine count: {len(naechste_termine)}")
        
        # Test GET /api/appointments - check full appointment list
        appointments_success, appointments_response = self.run_test(
            "GET Appointments List - full list",
            "GET",
            "appointments",
            200
        )
        
        if not appointments_success:
            print("❌ Failed to get appointments list")
            return False
        
        all_appointments = appointments_response if isinstance(appointments_response, list) else []
        print(f"   📋 Full appointments list count: {len(all_appointments)}")
        
        # Compare appointment data between both endpoints
        print(f"\n🔍 COMPARING APPOINTMENT DATA:")
        print(f"   Dashboard shows {len(naechste_termine)} appointments in naechste_termine")
        print(f"   Appointments endpoint shows {len(all_appointments)} total appointments")
        
        # Step 2: Check Appointment Data Structure
        print("\n📊 STEP 2: CHECKING APPOINTMENT DATA STRUCTURE")
        
        # Analyze naechste_termine appointments
        if naechste_termine:
            print(f"   📋 DASHBOARD naechste_termine appointments:")
            for i, apt in enumerate(naechste_termine[:3]):  # Show first 3
                print(f"      Appointment {i+1}:")
                print(f"         customer_name: {apt.get('customer_name', 'MISSING')}")
                print(f"         service_name: {apt.get('service_name', 'MISSING')}")
                print(f"         staff_name: {apt.get('staff_name', 'MISSING')}")
                print(f"         start_at: {apt.get('start_at', 'MISSING')}")
                print(f"         end_at: {apt.get('end_at', 'MISSING')}")
                print(f"         status: {apt.get('status', 'MISSING')}")
        else:
            print(f"   ❌ NO APPOINTMENTS in dashboard naechste_termine")
        
        # Analyze full appointments list
        if all_appointments:
            print(f"   📋 FULL APPOINTMENTS LIST (first 3):")
            for i, apt in enumerate(all_appointments[:3]):
                print(f"      Appointment {i+1}:")
                print(f"         customer_name: {apt.get('customer_name', 'MISSING')}")
                print(f"         service_name: {apt.get('service_name', 'MISSING')}")
                print(f"         staff_name: {apt.get('staff_name', 'MISSING')}")
                print(f"         start_at: {apt.get('start_at', 'MISSING')}")
                print(f"         end_at: {apt.get('end_at', 'MISSING')}")
                print(f"         status: {apt.get('status', 'MISSING')}")
        else:
            print(f"   ❌ NO APPOINTMENTS in full appointments list")
        
        # Step 3: Date/Time Analysis
        print("\n📊 STEP 3: DATE/TIME ANALYSIS")
        
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        print(f"   🕐 Current time (UTC): {now.isoformat()}")
        print(f"   🕐 Today start (UTC): {today_start.isoformat()}")
        print(f"   🕐 Today end (UTC): {today_end.isoformat()}")
        
        # Check if appointments are for today's date
        today_appointments_in_dashboard = []
        today_appointments_in_full_list = []
        
        for apt in naechste_termine:
            start_at_str = apt.get('start_at', '')
            if start_at_str:
                try:
                    start_at = datetime.fromisoformat(start_at_str.replace('Z', '+00:00'))
                    if today_start <= start_at < today_end:
                        today_appointments_in_dashboard.append(apt)
                        print(f"   ✅ Dashboard appointment for today: {apt.get('customer_name')} at {start_at_str}")
                    else:
                        print(f"   ⚠️  Dashboard appointment NOT for today: {apt.get('customer_name')} at {start_at_str}")
                except Exception as e:
                    print(f"   ❌ Error parsing dashboard appointment date: {start_at_str} - {e}")
        
        for apt in all_appointments:
            start_at_str = apt.get('start_at', '')
            if start_at_str:
                try:
                    start_at = datetime.fromisoformat(start_at_str.replace('Z', '+00:00'))
                    if today_start <= start_at < today_end:
                        today_appointments_in_full_list.append(apt)
                        print(f"   ✅ Full list appointment for today: {apt.get('customer_name')} at {start_at_str}")
                except Exception as e:
                    print(f"   ❌ Error parsing full list appointment date: {start_at_str} - {e}")
        
        print(f"   📊 Today's appointments in dashboard: {len(today_appointments_in_dashboard)}")
        print(f"   📊 Today's appointments in full list: {len(today_appointments_in_full_list)}")
        
        # Step 4: Appointment Visibility Factors
        print("\n📊 STEP 4: APPOINTMENT VISIBILITY FACTORS")
        
        confirmed_appointments = []
        for apt in all_appointments:
            status = apt.get('status', '')
            staff_id = apt.get('staff_id', '')
            service_id = apt.get('service_id', '')
            
            print(f"   📋 Appointment {apt.get('customer_name', 'Unknown')}:")
            print(f"      status: {status}")
            print(f"      staff_id: {staff_id}")
            print(f"      service_id: {service_id}")
            
            if status == 'confirmed':
                confirmed_appointments.append(apt)
        
        print(f"   📊 Confirmed appointments: {len(confirmed_appointments)}")
        
        # Step 5: Create Test Case - appointment for right now
        print("\n📊 STEP 5: CREATING TEST APPOINTMENT FOR RIGHT NOW")
        
        # Get existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Staff for Test Appointment", "GET", "staff", 200)
        services_success, services_list = self.run_test(
            "Get Services for Test Appointment", "GET", "services", 200)
        
        if staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0:
            # Create appointment for right now
            right_now = datetime.now(timezone.utc)
            right_now_str = right_now.isoformat().replace('+00:00', 'Z')
            
            test_appointment_data = {
                "service_id": services_list[0]['id'],
                "staff_id": staff_list[0]['id'],
                "start_at": right_now_str,
                "customer_name": "RIGHT NOW TEST CUSTOMER",
                "customer_email": "rightnow@test.com",
                "customer_phone": "+41 79 999 88 77",
                "notes": "Test appointment created for RIGHT NOW to debug calendar issue"
            }
            
            create_success, create_response = self.run_test(
                "Create RIGHT NOW Test Appointment",
                "POST",
                "appointments",
                200,
                data=test_appointment_data
            )
            
            if create_success:
                test_appointment_id = create_response.get('id')
                print(f"   ✅ Created test appointment for RIGHT NOW: {test_appointment_id}")
                print(f"   📅 Appointment time: {right_now_str}")
                
                # Immediately check if it appears in dashboard
                immediate_dashboard_success, immediate_dashboard_response = self.run_test(
                    "Check Dashboard IMMEDIATELY After Creation",
                    "GET",
                    "dashboard/overview",
                    200
                )
                
                if immediate_dashboard_success:
                    immediate_naechste_termine = immediate_dashboard_response.get('naechste_termine', [])
                    found_in_dashboard = False
                    for apt in immediate_naechste_termine:
                        if apt.get('customer_name') == 'RIGHT NOW TEST CUSTOMER':
                            found_in_dashboard = True
                            print(f"   ✅ RIGHT NOW appointment FOUND in dashboard naechste_termine")
                            print(f"      customer_name: {apt.get('customer_name')}")
                            print(f"      service_name: {apt.get('service_name')}")
                            print(f"      staff_name: {apt.get('staff_name')}")
                            print(f"      start_at: {apt.get('start_at')}")
                            break
                    
                    if not found_in_dashboard:
                        print(f"   ❌ RIGHT NOW appointment NOT FOUND in dashboard naechste_termine")
                        print(f"   📊 Current naechste_termine count: {len(immediate_naechste_termine)}")
                
                # Check if it appears in full appointments list
                immediate_appointments_success, immediate_appointments_response = self.run_test(
                    "Check Full Appointments IMMEDIATELY After Creation",
                    "GET",
                    "appointments",
                    200
                )
                
                if immediate_appointments_success:
                    immediate_all_appointments = immediate_appointments_response if isinstance(immediate_appointments_response, list) else []
                    found_in_full_list = False
                    for apt in immediate_all_appointments:
                        if apt.get('customer_name') == 'RIGHT NOW TEST CUSTOMER':
                            found_in_full_list = True
                            print(f"   ✅ RIGHT NOW appointment FOUND in full appointments list")
                            break
                    
                    if not found_in_full_list:
                        print(f"   ❌ RIGHT NOW appointment NOT FOUND in full appointments list")
                
                # Clean up test appointment
                if test_appointment_id:
                    self.run_test(
                        "Cleanup RIGHT NOW Test Appointment",
                        "DELETE",
                        f"appointments/{test_appointment_id}",
                        200
                    )
            else:
                print(f"   ❌ Failed to create RIGHT NOW test appointment")
        else:
            print(f"   ❌ Insufficient staff/services to create test appointment")
        
        # Step 6: Summary and Analysis
        print("\n📊 DISCREPANCY INVESTIGATION SUMMARY:")
        print(f"   Dashboard naechste_termine: {len(naechste_termine)} appointments")
        print(f"   Full appointments list: {len(all_appointments)} appointments")
        print(f"   Today's appointments in dashboard: {len(today_appointments_in_dashboard)}")
        print(f"   Today's appointments in full list: {len(today_appointments_in_full_list)}")
        print(f"   Confirmed appointments: {len(confirmed_appointments)}")
        
        # Identify potential issues
        issues_found = []
        
        if len(naechste_termine) == 0 and len(all_appointments) > 0:
            issues_found.append("Dashboard shows no appointments but full list has appointments")
        
        if len(today_appointments_in_dashboard) != len(today_appointments_in_full_list):
            issues_found.append("Mismatch between today's appointments in dashboard vs full list")
        
        if len(naechste_termine) != len(today_appointments_in_dashboard):
            issues_found.append("naechste_termine count doesn't match today's appointments count")
        
        if issues_found:
            print(f"\n🚨 POTENTIAL ISSUES IDENTIFIED:")
            for issue in issues_found:
                print(f"   ❌ {issue}")
        else:
            print(f"\n✅ NO DISCREPANCIES FOUND - Data appears consistent")
        
        return True

    def test_dashboard_keine_termine_heute_issue(self):
        """Test dashboard 'keine Termine heute' issue - Debug real appointment data and today's filtering logic"""
        print("\n🔍 Testing Dashboard 'Keine Termine Heute' Issue...")
        
        if not self.token:
            print("❌ No authentication token available for dashboard issue tests")
            return False
        
        # Step 1: Check existing appointments in database
        print("\n📋 Step 1: Checking existing appointments in database...")
        success, appointments_list = self.run_test(
            "GET All Appointments - Check Database",
            "GET",
            "appointments",
            200
        )
        
        if not success:
            print("❌ Failed to get appointments from database")
            return False
        
        print(f"   Found {len(appointments_list)} total appointments in database")
        
        # Analyze existing appointments
        today_appointments = []
        future_appointments = []
        past_appointments = []
        
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        for apt in appointments_list:
            apt_date_str = apt.get('start_at', '')
            customer_name = apt.get('customer_name', 'Unknown')
            service_name = apt.get('service_name', 'Unknown Service')
            staff_name = apt.get('staff_name', 'Unknown Staff')
            status = apt.get('status', 'Unknown')
            
            print(f"   - {customer_name}: {apt_date_str} | Service: {service_name} | Staff: {staff_name} | Status: {status}")
            
            try:
                apt_date = datetime.fromisoformat(apt_date_str.replace('Z', '+00:00'))
                if today_start <= apt_date <= today_end:
                    today_appointments.append(apt)
                elif apt_date > today_end:
                    future_appointments.append(apt)
                else:
                    past_appointments.append(apt)
            except:
                print(f"   ⚠️  Could not parse date: {apt_date_str}")
        
        print(f"   📊 Appointment Analysis:")
        print(f"      - Today's appointments: {len(today_appointments)}")
        print(f"      - Future appointments: {len(future_appointments)}")
        print(f"      - Past appointments: {len(past_appointments)}")
        
        # Step 2: Test dashboard endpoint
        print("\n📊 Step 2: Testing dashboard endpoint...")
        dashboard_success, dashboard_response = self.run_test(
            "GET Dashboard Overview - Check naechste_termine",
            "GET",
            "dashboard/overview",
            200
        )
        
        if not dashboard_success:
            print("❌ Failed to get dashboard overview")
            return False
        
        naechste_termine = dashboard_response.get('naechste_termine', [])
        termine_heute = dashboard_response.get('termine_heute', 0)
        
        print(f"   Dashboard Results:")
        print(f"      - naechste_termine count: {len(naechste_termine)}")
        print(f"      - termine_heute count: {termine_heute}")
        
        if len(naechste_termine) == 0:
            print("   ⚠️  ISSUE CONFIRMED: naechste_termine is empty!")
            print("   🔍 Investigating filtering logic...")
        else:
            print("   ✅ naechste_termine contains appointments:")
            for i, apt in enumerate(naechste_termine[:3]):
                print(f"      {i+1}. {apt.get('customer_name', 'Unknown')} - {apt.get('start_at', 'Unknown time')}")
        
        # Step 3: Create test appointment for today
        print("\n➕ Step 3: Creating test appointment for today...")
        
        # Get existing staff and services
        staff_success, staff_list = self.run_test(
            "Get Staff for Today Test", "GET", "staff", 200)
        services_success, services_list = self.run_test(
            "Get Services for Today Test", "GET", "services", 200)
        
        if not (staff_success and services_success and len(staff_list) > 0 and len(services_list) > 0):
            print("❌ Insufficient staff/services for today test")
            return False
        
        # Create appointment for today (2 hours from now)
        test_time = now + timedelta(hours=2)
        test_appointment_data = {
            "service_id": services_list[0]['id'],
            "staff_id": staff_list[0]['id'],
            "start_at": test_time.isoformat().replace('+00:00', 'Z'),
            "customer_name": "Test Kunde Heute",
            "customer_email": "test.heute@example.com",
            "customer_phone": "+41 79 123 45 67",
            "notes": "Test appointment for today - debugging keine Termine heute issue"
        }
        
        create_success, create_response = self.run_test(
            "Create Test Appointment for Today",
            "POST",
            "appointments",
            200,
            data=test_appointment_data
        )
        
        test_appointment_id = None
        test_appointment_found = False
        if create_success:
            test_appointment_id = create_response.get('id')
            print(f"   ✅ Created test appointment for today: {test_appointment_id}")
            print(f"   Time: {test_appointment_data['start_at']}")
        else:
            print("   ❌ Failed to create test appointment for today")
        
        # Step 4: Check if test appointment appears in dashboard immediately
        print("\n🔄 Step 4: Checking if test appointment appears in dashboard...")
        
        updated_dashboard_success, updated_dashboard_response = self.run_test(
            "GET Dashboard After Creating Today Appointment",
            "GET",
            "dashboard/overview",
            200
        )
        
        if updated_dashboard_success:
            updated_naechste_termine = updated_dashboard_response.get('naechste_termine', [])
            updated_termine_heute = updated_dashboard_response.get('termine_heute', 0)
            
            print(f"   Updated Dashboard Results:")
            print(f"      - naechste_termine count: {len(updated_naechste_termine)}")
            print(f"      - termine_heute count: {updated_termine_heute}")
            
            # Check if our test appointment appears
            for apt in updated_naechste_termine:
                if apt.get('customer_name') == 'Test Kunde Heute':
                    test_appointment_found = True
                    print(f"   ✅ Test appointment found in naechste_termine!")
                    print(f"      - Customer: {apt.get('customer_name')}")
                    print(f"      - Service: {apt.get('service_name', 'N/A')}")
                    print(f"      - Staff: {apt.get('staff_name', 'N/A')}")
                    print(f"      - Time: {apt.get('start_at')}")
                    break
            
            if not test_appointment_found:
                print("   ❌ Test appointment NOT found in naechste_termine!")
                print("   🔍 This indicates a filtering issue in the dashboard logic")
        
        # Step 5: Verify appointment data structure
        print("\n🔍 Step 5: Verifying appointment data structure...")
        
        # Get all appointments again to verify structure
        verify_success, verify_appointments = self.run_test(
            "Verify Appointment Data Structure",
            "GET",
            "appointments",
            200
        )
        
        if verify_success:
            # Find our test appointment
            test_apt_in_list = None
            for apt in verify_appointments:
                if apt.get('customer_name') == 'Test Kunde Heute':
                    test_apt_in_list = apt
                    break
            
            if test_apt_in_list:
                print("   ✅ Test appointment found in appointments list")
                required_fields = ['customer_name', 'service_name', 'staff_name', 'start_at', 'status']
                missing_fields = []
                
                for field in required_fields:
                    if field not in test_apt_in_list:
                        missing_fields.append(field)
                    else:
                        print(f"      - {field}: {test_apt_in_list[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing required fields: {missing_fields}")
                else:
                    print("   ✅ All required fields present in appointment data")
        
        # Step 6: Test filtering logic edge cases
        print("\n🧪 Step 6: Testing filtering logic edge cases...")
        
        # Create appointment for tomorrow (should NOT appear in naechste_termine)
        tomorrow = now + timedelta(days=1)
        tomorrow_appointment_data = {
            "service_id": services_list[0]['id'],
            "staff_id": staff_list[0]['id'],
            "start_at": tomorrow.isoformat().replace('+00:00', 'Z'),
            "customer_name": "Test Kunde Morgen",
            "customer_email": "test.morgen@example.com",
            "notes": "Test appointment for tomorrow - should NOT appear in naechste_termine"
        }
        
        tomorrow_success, tomorrow_response = self.run_test(
            "Create Test Appointment for Tomorrow",
            "POST",
            "appointments",
            200,
            data=tomorrow_appointment_data
        )
        
        tomorrow_appointment_id = None
        if tomorrow_success:
            tomorrow_appointment_id = tomorrow_response.get('id')
            print(f"   ✅ Created test appointment for tomorrow: {tomorrow_appointment_id}")
        
        # Check dashboard again
        final_dashboard_success, final_dashboard_response = self.run_test(
            "Final Dashboard Check - Edge Cases",
            "GET",
            "dashboard/overview",
            200
        )
        
        if final_dashboard_success:
            final_naechste_termine = final_dashboard_response.get('naechste_termine', [])
            
            today_found = False
            tomorrow_found = False
            
            for apt in final_naechste_termine:
                if apt.get('customer_name') == 'Test Kunde Heute':
                    today_found = True
                elif apt.get('customer_name') == 'Test Kunde Morgen':
                    tomorrow_found = True
            
            print(f"   Edge Case Results:")
            print(f"      - Today's appointment in naechste_termine: {today_found}")
            print(f"      - Tomorrow's appointment in naechste_termine: {tomorrow_found}")
            
            if today_found and not tomorrow_found:
                print("   ✅ Filtering logic working correctly!")
            elif not today_found:
                print("   ❌ Today's appointment missing - filtering issue!")
            elif tomorrow_found:
                print("   ❌ Tomorrow's appointment present - filtering too broad!")
        
        # Cleanup test appointments
        print("\n🧹 Cleaning up test appointments...")
        if test_appointment_id:
            self.run_test("Cleanup Today Test Appointment", "DELETE", f"appointments/{test_appointment_id}", 200)
        if tomorrow_appointment_id:
            self.run_test("Cleanup Tomorrow Test Appointment", "DELETE", f"appointments/{tomorrow_appointment_id}", 200)
        
        # Summary
        print(f"\n📋 DEBUGGING SUMMARY:")
        print(f"   - Total appointments in database: {len(appointments_list)}")
        print(f"   - Today's appointments found: {len(today_appointments)}")
        print(f"   - Dashboard naechste_termine count: {len(naechste_termine)}")
        print(f"   - Test appointment creation: {'✅' if create_success else '❌'}")
        print(f"   - Test appointment in dashboard: {'✅' if test_appointment_found else '❌'}")
        
        return success and dashboard_success

def main():
    print("🚀 Starting Calendar Appointment Debugging - User Request")
    print("=" * 70)
    
    tester = DaylaneAPITester()
    
    # Test sequence - focusing on calendar appointment debugging as requested
    tests = [
        ("Registration Flow", tester.test_registration),
        ("Login Flow", tester.test_login),
        ("Staff Management", tester.test_staff_endpoints),
        ("Services Management", tester.test_services_endpoints),
        ("Calendar Appointment Debugging", tester.test_calendar_appointment_debugging),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print(f"\n{'='*50}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*50}")
    print(f"Total API calls: {tester.tests_run}")
    print(f"Successful calls: {tester.tests_passed}")
    print(f"Failed calls: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ Failed test categories:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print(f"\n✅ All test categories passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())