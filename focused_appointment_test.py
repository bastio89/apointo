import requests
import json
from datetime import datetime, timedelta, timezone
import uuid

class FocusedAppointmentTester:
    def __init__(self, base_url="https://daylane-booking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tenant_id = None
        self.test_data = {}

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 {name}")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                print(f"   ✅ Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"   ❌ Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False, {}

    def setup_test_environment(self):
        """Setup test tenant, staff, and services"""
        print("🚀 Setting up test environment...")
        
        # Register tenant
        timestamp = datetime.now().strftime('%H%M%S')
        tenant_data = {
            "name": f"Focused Test Salon {timestamp}",
            "slug": f"focused-test-{timestamp}",
            "email": f"focused{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 123 45 67"
        }
        
        success, response = self.run_test(
            "Register Test Tenant", "POST", "auth/register", 200, tenant_data)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.tenant_id = response['tenant']['id']
            print(f"   ✅ Tenant registered: {response['tenant']['name']}")
        else:
            return False

        # Create staff
        staff_data = {"name": "Test Mitarbeiter", "color_tag": "#3B82F6"}
        success, response = self.run_test(
            "Create Test Staff", "POST", "staff", 200, staff_data)
        
        if success:
            self.test_data['staff_id'] = response['id']
            self.test_data['staff_name'] = response['name']
            print(f"   ✅ Staff created: {response['name']}")
        else:
            return False

        # Create service
        service_data = {
            "name": "Test Service",
            "description": "Test service for focused testing",
            "duration_minutes": 30,
            "price_chf": 50.0,
            "buffer_minutes": 5
        }
        success, response = self.run_test(
            "Create Test Service", "POST", "services", 200, service_data)
        
        if success:
            self.test_data['service_id'] = response['id']
            self.test_data['service_name'] = response['name']
            print(f"   ✅ Service created: {response['name']}")
            return True
        else:
            return False

    def test_appointment_crud_operations(self):
        """Test complete CRUD operations for appointments"""
        print("\n📋 Testing Appointment CRUD Operations...")
        
        # 1. Create appointment
        appointment_data = {
            "service_id": self.test_data['service_id'],
            "staff_id": self.test_data['staff_id'],
            "start_at": "2025-08-30T14:00:00Z",
            "customer_name": "Maria Schmidt",
            "customer_email": "maria.schmidt@example.com",
            "customer_phone": "+41 79 555 66 77",
            "notes": "Ersttermin für CRUD Test"
        }
        
        success, response = self.run_test(
            "CREATE Appointment", "POST", "appointments", 200, appointment_data)
        
        if not success:
            return False
        
        appointment_id = response['id']
        print(f"   ✅ Created appointment ID: {appointment_id}")
        
        # 2. Read appointments (GET) - Verify service_name and staff_name
        success, appointments = self.run_test(
            "READ Appointments List", "GET", "appointments", 200)
        
        if not success:
            return False
        
        # Find our appointment
        test_appointment = None
        for apt in appointments:
            if apt.get('id') == appointment_id:
                test_appointment = apt
                break
        
        if not test_appointment:
            print("   ❌ Created appointment not found in list")
            return False
        
        # Verify service_name and staff_name fields
        has_service_name = 'service_name' in test_appointment
        has_staff_name = 'staff_name' in test_appointment
        service_name_correct = test_appointment.get('service_name') == self.test_data['service_name']
        staff_name_correct = test_appointment.get('staff_name') == self.test_data['staff_name']
        
        print(f"   ✅ Service name included: {has_service_name}")
        print(f"   ✅ Staff name included: {has_staff_name}")
        print(f"   ✅ Service name correct: {service_name_correct} ({test_appointment.get('service_name')})")
        print(f"   ✅ Staff name correct: {staff_name_correct} ({test_appointment.get('staff_name')})")
        
        if not (has_service_name and has_staff_name and service_name_correct and staff_name_correct):
            print("   ❌ Service/Staff integration issue found")
            return False
        
        # 3. Update appointment (PUT)
        update_data = {
            "customer_name": "Maria Schmidt-Weber",
            "customer_email": "maria.schmidt-weber@example.com",
            "notes": "Aktualisierte Notizen nach CRUD Test",
            "status": "confirmed"
        }
        
        success, updated_apt = self.run_test(
            "UPDATE Appointment", "PUT", f"appointments/{appointment_id}", 200, update_data)
        
        if not success:
            return False
        
        print(f"   ✅ Updated name: {updated_apt.get('customer_name')}")
        print(f"   ✅ Updated email: {updated_apt.get('customer_email')}")
        print(f"   ✅ Updated notes: {updated_apt.get('notes')}")
        
        # 4. Delete appointment (DELETE)
        success, delete_response = self.run_test(
            "DELETE Appointment", "DELETE", f"appointments/{appointment_id}", 200)
        
        if not success:
            return False
        
        print(f"   ✅ Delete message: {delete_response.get('message')}")
        
        # 5. Verify deletion
        success, appointments_after = self.run_test(
            "Verify Deletion", "GET", "appointments", 200)
        
        if success:
            deleted_found = any(apt.get('id') == appointment_id for apt in appointments_after)
            if not deleted_found:
                print("   ✅ Appointment successfully deleted from list")
                return True
            else:
                print("   ❌ Appointment still found after deletion")
                return False
        
        return False

    def test_dashboard_with_real_data(self):
        """Test dashboard data with real appointments"""
        print("\n📊 Testing Dashboard with Real Appointment Data...")
        
        # Get initial dashboard state
        success, initial_dashboard = self.run_test(
            "Get Initial Dashboard State", "GET", "dashboard/overview", 200)
        
        if not success:
            return False
        
        initial_heute = initial_dashboard.get('termine_heute', 0)
        initial_monat = initial_dashboard.get('termine_dieses_monat', 0)
        initial_kunden = initial_dashboard.get('total_kunden', 0)
        
        print(f"   Initial - heute: {initial_heute}, monat: {initial_monat}, kunden: {initial_kunden}")
        
        # Create appointments for different scenarios
        today = datetime.now(timezone.utc)
        appointments_created = []
        
        # 1. Today's appointment
        today_apt_data = {
            "service_id": self.test_data['service_id'],
            "staff_id": self.test_data['staff_id'],
            "start_at": today.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "customer_name": "Heute Kunde",
            "customer_email": "heute@example.com",
            "status": "confirmed"
        }
        
        success, response = self.run_test(
            "Create Today's Appointment", "POST", "appointments", 200, today_apt_data)
        
        if success:
            appointments_created.append(response['id'])
        
        # 2. This month's appointment (different day)
        future_date = today + timedelta(days=5)
        month_apt_data = {
            "service_id": self.test_data['service_id'],
            "staff_id": self.test_data['staff_id'],
            "start_at": future_date.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "customer_name": "Monat Kunde",
            "customer_email": "monat@example.com",
            "status": "confirmed"
        }
        
        success, response = self.run_test(
            "Create This Month's Appointment", "POST", "appointments", 200, month_apt_data)
        
        if success:
            appointments_created.append(response['id'])
        
        # 3. Cancelled appointment (should not be counted)
        cancelled_apt_data = {
            "service_id": self.test_data['service_id'],
            "staff_id": self.test_data['staff_id'],
            "start_at": today.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "customer_name": "Storniert Kunde",
            "customer_email": "storniert@example.com",
            "status": "confirmed"
        }
        
        success, response = self.run_test(
            "Create Appointment to Cancel", "POST", "appointments", 200, cancelled_apt_data)
        
        if success:
            cancelled_id = response['id']
            appointments_created.append(cancelled_id)
            
            # Cancel it
            self.run_test(
                "Cancel Appointment", "PUT", f"appointments/{cancelled_id}", 200, 
                {"status": "cancelled"})
        
        # Check updated dashboard
        success, updated_dashboard = self.run_test(
            "Get Updated Dashboard State", "GET", "dashboard/overview", 200)
        
        if not success:
            return False
        
        updated_heute = updated_dashboard.get('termine_heute', 0)
        updated_monat = updated_dashboard.get('termine_dieses_monat', 0)
        updated_kunden = updated_dashboard.get('total_kunden', 0)
        naechste_termine = updated_dashboard.get('naechste_termine', [])
        
        print(f"   Updated - heute: {updated_heute}, monat: {updated_monat}, kunden: {updated_kunden}")
        print(f"   Naechste termine count: {len(naechste_termine)}")
        
        # Verify counts (should exclude cancelled appointments)
        expected_heute_increase = 1  # Only today's confirmed appointment
        expected_monat_increase = 2  # Today's + this month's confirmed appointments
        expected_kunden_increase = 2  # Unique customer emails (cancelled not counted in unique emails)
        
        heute_correct = (updated_heute - initial_heute) >= expected_heute_increase
        monat_correct = (updated_monat - initial_monat) >= expected_monat_increase
        kunden_correct = (updated_kunden - initial_kunden) >= expected_kunden_increase
        
        print(f"   ✅ termine_heute increase correct: {heute_correct}")
        print(f"   ✅ termine_dieses_monat increase correct: {monat_correct}")
        print(f"   ✅ total_kunden increase correct: {kunden_correct}")
        
        # Verify naechste_termine includes service_name and staff_name
        names_correct = True
        for apt in naechste_termine:
            has_service = 'service_name' in apt
            has_staff = 'staff_name' in apt
            if not (has_service and has_staff):
                names_correct = False
                break
        
        print(f"   ✅ naechste_termine includes service/staff names: {names_correct}")
        
        # Clean up
        for apt_id in appointments_created:
            self.run_test(f"Cleanup Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        return heute_correct and monat_correct and kunden_correct and names_correct

    def test_end_to_end_workflow(self):
        """Test complete end-to-end appointment workflow"""
        print("\n🔄 Testing End-to-End Appointment Workflow...")
        
        # Get initial dashboard
        success, initial_dashboard = self.run_test(
            "E2E: Initial Dashboard", "GET", "dashboard/overview", 200)
        
        if not success:
            return False
        
        initial_count = initial_dashboard.get('termine_dieses_monat', 0)
        
        # Step 1: Create appointment
        appointment_data = {
            "service_id": self.test_data['service_id'],
            "staff_id": self.test_data['staff_id'],
            "start_at": "2025-08-31T16:00:00Z",
            "customer_name": "E2E Test Kunde",
            "customer_email": "e2e@example.com",
            "customer_phone": "+41 79 999 88 77",
            "notes": "End-to-End Workflow Test"
        }
        
        success, create_response = self.run_test(
            "E2E: Create Appointment", "POST", "appointments", 200, appointment_data)
        
        if not success:
            return False
        
        appointment_id = create_response['id']
        
        # Step 2: Verify dashboard count increased
        success, after_create_dashboard = self.run_test(
            "E2E: Dashboard After Create", "GET", "dashboard/overview", 200)
        
        if not success:
            return False
        
        after_create_count = after_create_dashboard.get('termine_dieses_monat', 0)
        create_increase = after_create_count - initial_count
        print(f"   ✅ Dashboard count after create: +{create_increase}")
        
        # Step 3: Update appointment
        update_data = {
            "customer_name": "E2E Test Kunde Updated",
            "notes": "Updated via E2E workflow"
        }
        
        success, update_response = self.run_test(
            "E2E: Update Appointment", "PUT", f"appointments/{appointment_id}", 200, update_data)
        
        if not success:
            return False
        
        print(f"   ✅ Updated name: {update_response.get('customer_name')}")
        
        # Step 4: View in appointments list
        success, appointments_list = self.run_test(
            "E2E: View in List", "GET", "appointments", 200)
        
        if not success:
            return False
        
        # Find our appointment
        found_appointment = None
        for apt in appointments_list:
            if apt.get('id') == appointment_id:
                found_appointment = apt
                break
        
        if not found_appointment:
            print("   ❌ Appointment not found in list")
            return False
        
        print(f"   ✅ Found in list with service: {found_appointment.get('service_name')}")
        print(f"   ✅ Found in list with staff: {found_appointment.get('staff_name')}")
        
        # Step 5: Delete appointment
        success, delete_response = self.run_test(
            "E2E: Delete Appointment", "DELETE", f"appointments/{appointment_id}", 200)
        
        if not success:
            return False
        
        # Step 6: Verify dashboard count decreased
        success, after_delete_dashboard = self.run_test(
            "E2E: Dashboard After Delete", "GET", "dashboard/overview", 200)
        
        if not success:
            return False
        
        after_delete_count = after_delete_dashboard.get('termine_dieses_monat', 0)
        final_count_correct = after_delete_count == initial_count
        
        print(f"   ✅ Dashboard count after delete: {after_delete_count} (back to initial: {final_count_correct})")
        
        return final_count_correct

    def run_all_tests(self):
        """Run all focused tests"""
        print("🎯 FOCUSED APPOINTMENT MANAGEMENT & DASHBOARD TESTING")
        print("=" * 60)
        
        if not self.setup_test_environment():
            print("❌ Failed to setup test environment")
            return False
        
        tests = [
            ("Appointment CRUD Operations", self.test_appointment_crud_operations),
            ("Dashboard with Real Data", self.test_dashboard_with_real_data),
            ("End-to-End Workflow", self.test_end_to_end_workflow)
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            results[test_name] = test_func()
        
        print(f"\n{'='*60}")
        print("📊 FOCUSED TEST RESULTS")
        print(f"{'='*60}")
        
        all_passed = True
        for test_name, passed in results.items():
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{test_name}: {status}")
            if not passed:
                all_passed = False
        
        overall_status = "✅ ALL TESTS PASSED" if all_passed else "❌ SOME TESTS FAILED"
        print(f"\nOverall Result: {overall_status}")
        
        return all_passed

if __name__ == "__main__":
    tester = FocusedAppointmentTester()
    tester.run_all_tests()