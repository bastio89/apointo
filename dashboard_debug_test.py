import requests
import json
from datetime import datetime, timedelta, timezone
import uuid

class DashboardDebugTester:
    def __init__(self, base_url="https://daylane-booking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tenant_id = None
        self.test_tenant_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

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
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
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

    def setup_test_tenant(self):
        """Setup a test tenant with staff and services"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_tenant_data = {
            "name": f"Debug Salon {timestamp}",
            "slug": f"debug-salon-{timestamp}",
            "email": f"debug{timestamp}@example.com",
            "password": "DebugPass123!",
            "phone": "+41 44 123 45 67"
        }
        
        # Register tenant
        success, response = self.run_test(
            "Register Debug Tenant",
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
                print(f"   Tenant ID: {self.tenant_id}")
                return True
        return False

    def create_staff_and_service(self):
        """Create staff and service for testing"""
        # Create staff
        staff_data = {
            "name": "Debug Staff Member",
            "color_tag": "#FF5722"
        }
        
        staff_success, staff_response = self.run_test(
            "Create Debug Staff",
            "POST",
            "staff",
            200,
            data=staff_data
        )
        
        if not staff_success:
            return False, None, None
        
        staff_id = staff_response['id']
        
        # Create service
        service_data = {
            "name": "Debug Service",
            "description": "Debug service for testing",
            "duration_minutes": 60,
            "price_chf": 80.0,
            "buffer_minutes": 10
        }
        
        service_success, service_response = self.run_test(
            "Create Debug Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if not service_success:
            return False, None, None
        
        service_id = service_response['id']
        
        return True, staff_id, service_id

    def debug_dashboard_issue(self):
        """Debug the 'keine Termine heute' issue"""
        print("\n" + "="*80)
        print("🔍 DEBUGGING DASHBOARD 'KEINE TERMINE HEUTE' ISSUE")
        print("="*80)
        
        # Setup
        if not self.setup_test_tenant():
            print("❌ Failed to setup test tenant")
            return False
        
        success, staff_id, service_id = self.create_staff_and_service()
        if not success:
            print("❌ Failed to create staff and service")
            return False
        
        print(f"\n📋 Test Setup Complete:")
        print(f"   Staff ID: {staff_id}")
        print(f"   Service ID: {service_id}")
        
        # 1. Check initial dashboard state
        print(f"\n1️⃣ CHECKING INITIAL DASHBOARD STATE")
        success, initial_dashboard = self.run_test(
            "Initial Dashboard State",
            "GET",
            "dashboard/overview",
            200
        )
        
        if success:
            print(f"   termine_heute: {initial_dashboard.get('termine_heute', 'N/A')}")
            print(f"   termine_dieses_monat: {initial_dashboard.get('termine_dieses_monat', 'N/A')}")
            print(f"   naechste_termine count: {len(initial_dashboard.get('naechste_termine', []))}")
            print(f"   naechste_termine: {initial_dashboard.get('naechste_termine', [])}")
        
        # 2. Check all appointments in database
        print(f"\n2️⃣ CHECKING ALL APPOINTMENTS IN DATABASE")
        success, all_appointments = self.run_test(
            "Get All Appointments",
            "GET",
            "appointments",
            200
        )
        
        if success:
            print(f"   Total appointments in database: {len(all_appointments)}")
            for i, apt in enumerate(all_appointments):
                print(f"   Appointment {i+1}:")
                print(f"     - Customer: {apt.get('customer_name', 'N/A')}")
                print(f"     - Start: {apt.get('start_at', 'N/A')}")
                print(f"     - Status: {apt.get('status', 'N/A')}")
                print(f"     - Service: {apt.get('service_name', 'N/A')}")
                print(f"     - Staff: {apt.get('staff_name', 'N/A')}")
        
        # 3. Create appointment for TODAY at different times
        print(f"\n3️⃣ CREATING APPOINTMENTS FOR TODAY")
        
        now = datetime.now(timezone.utc)
        print(f"   Current UTC time: {now}")
        
        # Create appointments at different times today
        today_appointments = []
        
        # Morning appointment (past)
        morning_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
        morning_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": morning_time.isoformat(),
            "customer_name": "Morgen Kunde",
            "customer_email": "morgen@debug.com",
            "notes": "Morning appointment for today"
        }
        
        success, morning_apt = self.run_test(
            "Create Morning Appointment (Today)",
            "POST",
            "appointments",
            200,
            data=morning_data
        )
        
        if success:
            today_appointments.append(morning_apt['id'])
            print(f"   ✅ Created morning appointment: {morning_apt['id']}")
        
        # Afternoon appointment (future)
        afternoon_time = now.replace(hour=14, minute=0, second=0, microsecond=0)
        if afternoon_time <= now:
            afternoon_time = now + timedelta(hours=2)
        
        afternoon_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": afternoon_time.isoformat(),
            "customer_name": "Nachmittag Kunde",
            "customer_email": "nachmittag@debug.com",
            "notes": "Afternoon appointment for today"
        }
        
        success, afternoon_apt = self.run_test(
            "Create Afternoon Appointment (Today)",
            "POST",
            "appointments",
            200,
            data=afternoon_data
        )
        
        if success:
            today_appointments.append(afternoon_apt['id'])
            print(f"   ✅ Created afternoon appointment: {afternoon_apt['id']}")
        
        # Evening appointment (future)
        evening_time = now.replace(hour=18, minute=0, second=0, microsecond=0)
        if evening_time <= now:
            evening_time = now + timedelta(hours=4)
        
        evening_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": evening_time.isoformat(),
            "customer_name": "Abend Kunde",
            "customer_email": "abend@debug.com",
            "notes": "Evening appointment for today"
        }
        
        success, evening_apt = self.run_test(
            "Create Evening Appointment (Today)",
            "POST",
            "appointments",
            200,
            data=evening_data
        )
        
        if success:
            today_appointments.append(evening_apt['id'])
            print(f"   ✅ Created evening appointment: {evening_apt['id']}")
        
        # 4. Check dashboard after creating today's appointments
        print(f"\n4️⃣ CHECKING DASHBOARD AFTER CREATING TODAY'S APPOINTMENTS")
        success, updated_dashboard = self.run_test(
            "Dashboard After Creating Today's Appointments",
            "GET",
            "dashboard/overview",
            200
        )
        
        if success:
            naechste_termine = updated_dashboard.get('naechste_termine', [])
            print(f"   termine_heute: {updated_dashboard.get('termine_heute', 'N/A')}")
            print(f"   termine_dieses_monat: {updated_dashboard.get('termine_dieses_monat', 'N/A')}")
            print(f"   naechste_termine count: {len(naechste_termine)}")
            
            if len(naechste_termine) == 0:
                print(f"   ❌ ISSUE FOUND: naechste_termine is empty despite creating today's appointments!")
                print(f"   🔍 This explains the 'keine Termine heute' issue")
            else:
                print(f"   ✅ naechste_termine contains appointments:")
                for i, apt in enumerate(naechste_termine):
                    print(f"     Appointment {i+1}:")
                    print(f"       - Customer: {apt.get('customer_name', 'N/A')}")
                    print(f"       - Start: {apt.get('start_at', 'N/A')}")
                    print(f"       - Service: {apt.get('service_name', 'N/A')}")
                    print(f"       - Staff: {apt.get('staff_name', 'N/A')}")
        
        # 5. Analyze the timezone and filtering logic
        print(f"\n5️⃣ ANALYZING TIMEZONE AND FILTERING LOGIC")
        
        # Check what the backend considers as "today"
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        print(f"   Current UTC time: {now}")
        print(f"   Today start (UTC): {today_start}")
        print(f"   Today end (UTC): {today_end}")
        
        # Check all appointments again to see which ones should be in today's range
        success, all_appointments_after = self.run_test(
            "Get All Appointments After Creation",
            "GET",
            "appointments",
            200
        )
        
        if success:
            print(f"   Total appointments after creation: {len(all_appointments_after)}")
            today_count = 0
            for apt in all_appointments_after:
                apt_start = apt.get('start_at', '')
                apt_status = apt.get('status', '')
                try:
                    apt_datetime = datetime.fromisoformat(apt_start.replace('Z', '+00:00'))
                    is_today = today_start <= apt_datetime < today_end
                    is_confirmed = apt_status == 'confirmed'
                    
                    print(f"   Appointment: {apt.get('customer_name', 'N/A')}")
                    print(f"     - Start: {apt_start}")
                    print(f"     - Status: {apt_status}")
                    print(f"     - Is today: {is_today}")
                    print(f"     - Is confirmed: {is_confirmed}")
                    print(f"     - Should be in naechste_termine: {is_today and is_confirmed}")
                    
                    if is_today and is_confirmed:
                        today_count += 1
                except Exception as e:
                    print(f"     - Error parsing date: {e}")
            
            print(f"   Expected appointments in naechste_termine: {today_count}")
            actual_count = len(updated_dashboard.get('naechste_termine', []))
            print(f"   Actual appointments in naechste_termine: {actual_count}")
            
            if today_count > 0 and actual_count == 0:
                print(f"   ❌ CONFIRMED ISSUE: Backend filtering logic is not working correctly!")
                print(f"   🔍 There are {today_count} confirmed appointments for today but naechste_termine is empty")
            elif today_count == actual_count:
                print(f"   ✅ Filtering logic is working correctly")
            else:
                print(f"   ⚠️  Partial issue: Expected {today_count} but got {actual_count}")
        
        # 6. Test with appointment exactly at current time
        print(f"\n6️⃣ TESTING WITH APPOINTMENT AT CURRENT TIME")
        
        # Create appointment starting now
        now_plus_5min = now + timedelta(minutes=5)
        now_data = {
            "service_id": service_id,
            "staff_id": staff_id,
            "start_at": now_plus_5min.isoformat(),
            "customer_name": "Jetzt Kunde",
            "customer_email": "jetzt@debug.com",
            "notes": "Appointment starting in 5 minutes"
        }
        
        success, now_apt = self.run_test(
            "Create Appointment Starting Soon",
            "POST",
            "appointments",
            200,
            data=now_data
        )
        
        if success:
            today_appointments.append(now_apt['id'])
            print(f"   ✅ Created appointment starting soon: {now_apt['id']}")
            
            # Check dashboard immediately
            success, immediate_dashboard = self.run_test(
                "Dashboard After Creating Immediate Appointment",
                "GET",
                "dashboard/overview",
                200
            )
            
            if success:
                immediate_naechste = immediate_dashboard.get('naechste_termine', [])
                print(f"   naechste_termine count after immediate appointment: {len(immediate_naechste)}")
                
                if len(immediate_naechste) == 0:
                    print(f"   ❌ CRITICAL: Even appointment starting in 5 minutes doesn't appear!")
                else:
                    print(f"   ✅ Immediate appointment appears in naechste_termine")
        
        # 7. Clean up
        print(f"\n7️⃣ CLEANING UP TEST DATA")
        for apt_id in today_appointments:
            self.run_test(f"Delete Test Appointment", "DELETE", f"appointments/{apt_id}", 200)
        
        # Final summary
        print(f"\n" + "="*80)
        print("📊 DASHBOARD DEBUG SUMMARY")
        print("="*80)
        
        final_success, final_dashboard = self.run_test(
            "Final Dashboard State",
            "GET",
            "dashboard/overview",
            200
        )
        
        if final_success:
            final_naechste = final_dashboard.get('naechste_termine', [])
            print(f"Final naechste_termine count: {len(final_naechste)}")
            print(f"Final termine_heute: {final_dashboard.get('termine_heute', 'N/A')}")
            
            if len(final_naechste) == 0 and final_dashboard.get('termine_heute', 0) == 0:
                print(f"✅ Clean state restored - no appointments remaining")
            else:
                print(f"⚠️  Some appointments may still exist")
        
        return True

if __name__ == "__main__":
    tester = DashboardDebugTester()
    tester.debug_dashboard_issue()