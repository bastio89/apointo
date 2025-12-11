import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class StaffHoursAPITester:
    def __init__(self, base_url="https://daylane-booking.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tenant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_tenant_data = None
        self.test_staff_id = None

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
                    if isinstance(response_data, dict) and len(str(response_data)) < 1000:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
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

    def setup_test_environment(self):
        """Setup test tenant and authentication"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_tenant_data = {
            "name": f"Staff Hours Test Salon {timestamp}",
            "slug": f"staff-hours-test-{timestamp}",
            "email": f"staffhours{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "+41 44 123 45 67"
        }
        
        success, response = self.run_test(
            "Setup - Tenant Registration",
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
                return True
        return False

    def test_staff_creation_with_default_hours(self):
        """Test POST /api/staff creates staff with default Monday-Friday 09:00-17:00 working hours"""
        print("\n🔍 Testing Staff Creation with Default Working Hours...")
        
        staff_data = {
            "name": "Anna Müller",
            "color_tag": "#E91E63"
        }
        
        success, response = self.run_test(
            "Create Staff with Default Hours",
            "POST",
            "staff",
            200,
            data=staff_data
        )
        
        if success and 'id' in response:
            self.test_staff_id = response['id']
            print(f"   Created staff ID: {self.test_staff_id}")
            
            # Verify working hours structure
            working_hours = response.get('working_hours', {})
            
            # Check that all days are present
            expected_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            all_days_present = all(day in working_hours for day in expected_days)
            
            if all_days_present:
                print("   ✅ All 7 days present in working_hours")
                
                # Check Monday-Friday default hours (09:00-17:00, is_working=True)
                weekdays_correct = True
                for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']:
                    day_data = working_hours.get(day, {})
                    is_working = day_data.get('is_working', False)
                    start_time = day_data.get('start_time')
                    end_time = day_data.get('end_time')
                    
                    if not (is_working and start_time == "09:00" and end_time == "17:00"):
                        weekdays_correct = False
                        print(f"   ❌ {day.capitalize()} incorrect: is_working={is_working}, start={start_time}, end={end_time}")
                    else:
                        print(f"   ✅ {day.capitalize()}: 09:00-17:00 (working)")
                
                # Check Saturday-Sunday default (is_working=False)
                weekends_correct = True
                for day in ['saturday', 'sunday']:
                    day_data = working_hours.get(day, {})
                    is_working = day_data.get('is_working', True)  # Should be False
                    
                    if is_working:
                        weekends_correct = False
                        print(f"   ❌ {day.capitalize()} should not be working day")
                    else:
                        print(f"   ✅ {day.capitalize()}: Not working (correct)")
                
                return weekdays_correct and weekends_correct
            else:
                print("   ❌ Missing days in working_hours structure")
                return False
        
        return False

    def test_get_staff_with_working_hours(self):
        """Test GET /api/staff returns staff with WorkingDay structure"""
        print("\n🔍 Testing GET Staff with Working Hours Structure...")
        
        success, response = self.run_test(
            "Get Staff List with Working Hours",
            "GET",
            "staff",
            200
        )
        
        if success and len(response) > 0:
            staff_member = response[0]  # Get first staff member
            
            # Verify working_hours structure exists
            if 'working_hours' not in staff_member:
                print("   ❌ working_hours field missing from staff response")
                return False
            
            working_hours = staff_member['working_hours']
            print(f"   ✅ working_hours field present")
            
            # Verify all 7 days are present
            expected_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            missing_days = [day for day in expected_days if day not in working_hours]
            
            if missing_days:
                print(f"   ❌ Missing days: {missing_days}")
                return False
            
            print("   ✅ All 7 days present in WeeklySchedule")
            
            # Verify WorkingDay structure for each day
            structure_valid = True
            for day in expected_days:
                day_data = working_hours[day]
                required_fields = ['is_working', 'start_time', 'end_time']
                
                for field in required_fields:
                    if field not in day_data:
                        print(f"   ❌ {day} missing field: {field}")
                        structure_valid = False
                
                # Check data types
                if not isinstance(day_data.get('is_working'), bool):
                    print(f"   ❌ {day} is_working should be boolean")
                    structure_valid = False
            
            if structure_valid:
                print("   ✅ WorkingDay structure valid for all days")
            
            return structure_valid
        
        print("   ❌ No staff members found")
        return False

    def test_update_staff_working_hours(self):
        """Test PUT /api/staff/{id}/working-hours updates individual staff working hours"""
        print("\n🔍 Testing Update Staff Working Hours...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        # Define custom working hours
        custom_hours = {
            "monday": {"is_working": True, "start_time": "08:00", "end_time": "16:00"},
            "tuesday": {"is_working": True, "start_time": "08:00", "end_time": "16:00"},
            "wednesday": {"is_working": False, "start_time": None, "end_time": None},
            "thursday": {"is_working": True, "start_time": "10:00", "end_time": "18:00"},
            "friday": {"is_working": True, "start_time": "08:00", "end_time": "14:00"},
            "saturday": {"is_working": True, "start_time": "09:00", "end_time": "13:00"},
            "sunday": {"is_working": False, "start_time": None, "end_time": None}
        }
        
        success, response = self.run_test(
            "Update Staff Working Hours",
            "PUT",
            f"staff/{self.test_staff_id}/working-hours",
            200,
            data=custom_hours
        )
        
        if success:
            # Verify the response contains updated working hours
            updated_hours = response.get('working_hours', {})
            
            # Check specific updates
            checks_passed = 0
            total_checks = 0
            
            # Monday: 08:00-16:00
            monday = updated_hours.get('monday', {})
            total_checks += 1
            if (monday.get('is_working') == True and 
                monday.get('start_time') == "08:00" and 
                monday.get('end_time') == "16:00"):
                checks_passed += 1
                print("   ✅ Monday updated correctly: 08:00-16:00")
            else:
                print(f"   ❌ Monday incorrect: {monday}")
            
            # Wednesday: Not working
            wednesday = updated_hours.get('wednesday', {})
            total_checks += 1
            if wednesday.get('is_working') == False:
                checks_passed += 1
                print("   ✅ Wednesday updated correctly: Not working")
            else:
                print(f"   ❌ Wednesday incorrect: {wednesday}")
            
            # Saturday: 09:00-13:00 (now working)
            saturday = updated_hours.get('saturday', {})
            total_checks += 1
            if (saturday.get('is_working') == True and 
                saturday.get('start_time') == "09:00" and 
                saturday.get('end_time') == "13:00"):
                checks_passed += 1
                print("   ✅ Saturday updated correctly: 09:00-13:00")
            else:
                print(f"   ❌ Saturday incorrect: {saturday}")
            
            return checks_passed == total_checks
        
        return False

    def test_general_staff_update(self):
        """Test PUT /api/staff/{id} general staff update functionality"""
        print("\n🔍 Testing General Staff Update...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        # Test updating name and color
        update_data = {
            "name": "Anna Müller-Weber",
            "color_tag": "#9C27B0",
            "active": True
        }
        
        success, response = self.run_test(
            "Update Staff General Info",
            "PUT",
            f"staff/{self.test_staff_id}",
            200,
            data=update_data
        )
        
        if success:
            # Verify updates
            name_correct = response.get('name') == "Anna Müller-Weber"
            color_correct = response.get('color_tag') == "#9C27B0"
            active_correct = response.get('active') == True
            
            print(f"   ✅ Name updated: {name_correct}")
            print(f"   ✅ Color updated: {color_correct}")
            print(f"   ✅ Active status updated: {active_correct}")
            
            # Verify working_hours are preserved
            working_hours_preserved = 'working_hours' in response
            print(f"   ✅ Working hours preserved: {working_hours_preserved}")
            
            return name_correct and color_correct and active_correct and working_hours_preserved
        
        return False

    def test_staff_working_hours_with_custom_schedule(self):
        """Test updating working hours with custom WeeklySchedule"""
        print("\n🔍 Testing Custom WeeklySchedule Update...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        # Create a complex schedule
        complex_schedule = {
            "monday": {"is_working": True, "start_time": "07:30", "end_time": "15:30"},
            "tuesday": {"is_working": True, "start_time": "09:00", "end_time": "17:00"},
            "wednesday": {"is_working": True, "start_time": "11:00", "end_time": "19:00"},
            "thursday": {"is_working": False, "start_time": None, "end_time": None},
            "friday": {"is_working": True, "start_time": "08:00", "end_time": "12:00"},
            "saturday": {"is_working": True, "start_time": "10:00", "end_time": "16:00"},
            "sunday": {"is_working": True, "start_time": "12:00", "end_time": "18:00"}
        }
        
        success, response = self.run_test(
            "Update Complex Working Schedule",
            "PUT",
            f"staff/{self.test_staff_id}/working-hours",
            200,
            data=complex_schedule
        )
        
        if success:
            updated_hours = response.get('working_hours', {})
            
            # Verify complex schedule
            test_cases = [
                ("Monday", "monday", True, "07:30", "15:30"),
                ("Tuesday", "tuesday", True, "09:00", "17:00"),
                ("Wednesday", "wednesday", True, "11:00", "19:00"),
                ("Thursday", "thursday", False, None, None),
                ("Friday", "friday", True, "08:00", "12:00"),
                ("Saturday", "saturday", True, "10:00", "16:00"),
                ("Sunday", "sunday", True, "12:00", "18:00")
            ]
            
            all_correct = True
            for day_name, day_key, expected_working, expected_start, expected_end in test_cases:
                day_data = updated_hours.get(day_key, {})
                is_working = day_data.get('is_working')
                start_time = day_data.get('start_time')
                end_time = day_data.get('end_time')
                
                if (is_working == expected_working and 
                    start_time == expected_start and 
                    end_time == expected_end):
                    print(f"   ✅ {day_name}: Correct")
                else:
                    print(f"   ❌ {day_name}: Expected working={expected_working}, start={expected_start}, end={expected_end}")
                    print(f"      Got working={is_working}, start={start_time}, end={end_time}")
                    all_correct = False
            
            return all_correct
        
        return False

    def test_special_closure_dates_creation(self):
        """Test POST /api/staff/{staff_id}/closures creates new closure dates"""
        print("\n🔍 Testing Special Closure Dates Creation...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        # Test 1: Full day closure
        full_day_closure = {
            "date": "2025-12-25",
            "reason": "Weihnachten",
            "all_day": True
        }
        
        success1, response1 = self.run_test(
            "Create Full Day Closure",
            "POST",
            f"staff/{self.test_staff_id}/closures",
            200,
            data=full_day_closure
        )
        
        closure_id_1 = None
        if success1:
            closure_id_1 = response1.get('id')
            print(f"   ✅ Full day closure created: {closure_id_1}")
            
            # Verify structure
            date_correct = response1.get('date') == "2025-12-25"
            reason_correct = response1.get('reason') == "Weihnachten"
            all_day_correct = response1.get('all_day') == True
            staff_id_correct = response1.get('staff_id') == self.test_staff_id
            
            print(f"   ✅ Date correct: {date_correct}")
            print(f"   ✅ Reason correct: {reason_correct}")
            print(f"   ✅ All day correct: {all_day_correct}")
            print(f"   ✅ Staff ID correct: {staff_id_correct}")
        
        # Test 2: Partial day closure
        partial_day_closure = {
            "date": "2025-06-15",
            "reason": "Arzttermin",
            "all_day": False,
            "start_time": "14:00",
            "end_time": "16:00"
        }
        
        success2, response2 = self.run_test(
            "Create Partial Day Closure",
            "POST",
            f"staff/{self.test_staff_id}/closures",
            200,
            data=partial_day_closure
        )
        
        closure_id_2 = None
        if success2:
            closure_id_2 = response2.get('id')
            print(f"   ✅ Partial day closure created: {closure_id_2}")
            
            # Verify partial day structure
            all_day_false = response2.get('all_day') == False
            start_time_correct = response2.get('start_time') == "14:00"
            end_time_correct = response2.get('end_time') == "16:00"
            
            print(f"   ✅ All day false: {all_day_false}")
            print(f"   ✅ Start time correct: {start_time_correct}")
            print(f"   ✅ End time correct: {end_time_correct}")
        
        # Store closure IDs for cleanup
        self.test_closure_ids = [closure_id_1, closure_id_2]
        
        return success1 and success2

    def test_get_staff_closures(self):
        """Test GET /api/staff/{staff_id}/closures retrieves closure dates"""
        print("\n🔍 Testing Get Staff Closures...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        success, response = self.run_test(
            "Get Staff Closures",
            "GET",
            f"staff/{self.test_staff_id}/closures",
            200
        )
        
        if success:
            closures = response if isinstance(response, list) else []
            print(f"   ✅ Retrieved {len(closures)} closures")
            
            # Verify closure structure
            if len(closures) >= 2:
                # Check first closure (should be Christmas)
                christmas_closure = None
                doctor_closure = None
                
                for closure in closures:
                    if closure.get('date') == '2025-12-25':
                        christmas_closure = closure
                    elif closure.get('date') == '2025-06-15':
                        doctor_closure = closure
                
                christmas_correct = (christmas_closure and 
                                   christmas_closure.get('reason') == 'Weihnachten' and
                                   christmas_closure.get('all_day') == True)
                
                doctor_correct = (doctor_closure and 
                                doctor_closure.get('reason') == 'Arzttermin' and
                                doctor_closure.get('all_day') == False and
                                doctor_closure.get('start_time') == '14:00' and
                                doctor_closure.get('end_time') == '16:00')
                
                print(f"   ✅ Christmas closure correct: {christmas_correct}")
                print(f"   ✅ Doctor appointment closure correct: {doctor_correct}")
                
                return christmas_correct and doctor_correct
            else:
                print("   ❌ Expected at least 2 closures")
                return False
        
        return False

    def test_get_all_closures(self):
        """Test GET /api/closures retrieves all closures for tenant"""
        print("\n🔍 Testing Get All Closures for Tenant...")
        
        success, response = self.run_test(
            "Get All Tenant Closures",
            "GET",
            "closures",
            200
        )
        
        if success:
            closures = response if isinstance(response, list) else []
            print(f"   ✅ Retrieved {len(closures)} total closures for tenant")
            
            # Verify all closures belong to our tenant and have proper structure
            all_valid = True
            for closure in closures:
                required_fields = ['id', 'staff_id', 'tenant_id', 'date', 'all_day', 'created_at']
                missing_fields = [field for field in required_fields if field not in closure]
                
                if missing_fields:
                    print(f"   ❌ Closure missing fields: {missing_fields}")
                    all_valid = False
                
                # Verify tenant_id matches (should be our tenant)
                if closure.get('tenant_id') != self.tenant_id:
                    print(f"   ❌ Closure has wrong tenant_id: {closure.get('tenant_id')}")
                    all_valid = False
            
            if all_valid:
                print("   ✅ All closures have valid structure and correct tenant_id")
            
            return all_valid and len(closures) >= 2
        
        return False

    def test_delete_closure_dates(self):
        """Test DELETE /api/staff/{staff_id}/closures/{closure_id}"""
        print("\n🔍 Testing Delete Closure Dates...")
        
        if not self.test_staff_id or not hasattr(self, 'test_closure_ids'):
            print("   ❌ No test staff ID or closure IDs available")
            return False
        
        # Delete first closure
        closure_id_to_delete = self.test_closure_ids[0]
        if closure_id_to_delete:
            success1, response1 = self.run_test(
                "Delete First Closure",
                "DELETE",
                f"staff/{self.test_staff_id}/closures/{closure_id_to_delete}",
                200
            )
            
            if success1:
                print(f"   ✅ Closure deleted successfully")
                message = response1.get('message', '')
                print(f"   Message: {message}")
            
            # Verify closure is actually deleted
            success2, response2 = self.run_test(
                "Verify Closure Deleted",
                "GET",
                f"staff/{self.test_staff_id}/closures",
                200
            )
            
            if success2:
                remaining_closures = response2 if isinstance(response2, list) else []
                deleted_closure_found = any(c.get('id') == closure_id_to_delete for c in remaining_closures)
                
                if not deleted_closure_found:
                    print("   ✅ Closure successfully removed from list")
                    return True
                else:
                    print("   ❌ Closure still found in list after deletion")
                    return False
        
        return False

    def test_date_format_validation(self):
        """Test date format validation for closures"""
        print("\n🔍 Testing Date Format Validation...")
        
        if not self.test_staff_id:
            print("   ❌ No test staff ID available")
            return False
        
        # Test invalid date formats
        invalid_formats = [
            {"date": "25-12-2025", "reason": "Invalid format 1"},  # DD-MM-YYYY
            {"date": "12/25/2025", "reason": "Invalid format 2"},  # MM/DD/YYYY
            {"date": "2025/12/25", "reason": "Invalid format 3"},  # YYYY/MM/DD
            {"date": "25.12.2025", "reason": "Invalid format 4"},  # DD.MM.YYYY
            {"date": "invalid-date", "reason": "Invalid format 5"} # Completely invalid
        ]
        
        validation_working = True
        for i, invalid_data in enumerate(invalid_formats):
            success, response = self.run_test(
                f"Test Invalid Date Format {i+1}",
                "POST",
                f"staff/{self.test_staff_id}/closures",
                400,  # Should return 400 Bad Request
                data=invalid_data
            )
            
            if success:
                print(f"   ✅ Invalid format {i+1} correctly rejected")
            else:
                print(f"   ❌ Invalid format {i+1} was accepted (should be rejected)")
                validation_working = False
        
        # Test valid format
        valid_data = {
            "date": "2025-07-04",
            "reason": "Valid format test",
            "all_day": True
        }
        
        success_valid, response_valid = self.run_test(
            "Test Valid Date Format",
            "POST",
            f"staff/{self.test_staff_id}/closures",
            200,
            data=valid_data
        )
        
        if success_valid:
            print("   ✅ Valid YYYY-MM-DD format accepted")
            # Clean up
            closure_id = response_valid.get('id')
            if closure_id:
                self.run_test(
                    "Cleanup Valid Date Test",
                    "DELETE",
                    f"staff/{self.test_staff_id}/closures/{closure_id}",
                    200
                )
        else:
            print("   ❌ Valid YYYY-MM-DD format rejected")
            validation_working = False
        
        return validation_working

    def test_authorization_and_tenant_isolation(self):
        """Test authorization and tenant isolation"""
        print("\n🔍 Testing Authorization and Tenant Isolation...")
        
        # Test 1: Access without authentication
        temp_token = self.token
        self.token = None
        
        success1, _ = self.run_test(
            "Staff Access - No Auth",
            "GET",
            "staff",
            401
        )
        
        success2, _ = self.run_test(
            "Closures Access - No Auth",
            "GET",
            "closures",
            401
        )
        
        # Restore token
        self.token = temp_token
        
        if success1 and success2:
            print("   ✅ Unauthorized access correctly blocked")
        else:
            print("   ❌ Unauthorized access not properly blocked")
            return False
        
        # Test 2: Access to non-existent staff (should return 404)
        fake_staff_id = str(uuid.uuid4())
        
        success3, _ = self.run_test(
            "Access Non-existent Staff Working Hours",
            "PUT",
            f"staff/{fake_staff_id}/working-hours",
            404,
            data={"monday": {"is_working": True, "start_time": "09:00", "end_time": "17:00"}}
        )
        
        success4, _ = self.run_test(
            "Access Non-existent Staff Closures",
            "GET",
            f"staff/{fake_staff_id}/closures",
            404
        )
        
        if success3 and success4:
            print("   ✅ Non-existent staff access correctly returns 404")
        else:
            print("   ❌ Non-existent staff access not handled properly")
            return False
        
        return True

    def test_backward_compatibility(self):
        """Test backward compatibility with existing staff records"""
        print("\n🔍 Testing Backward Compatibility...")
        
        # Create staff without specifying working_hours (should get defaults)
        staff_data_minimal = {
            "name": "Backward Compatibility Test Staff"
        }
        
        success, response = self.run_test(
            "Create Staff - Minimal Data",
            "POST",
            "staff",
            200,
            data=staff_data_minimal
        )
        
        if success:
            # Verify default working hours are applied
            working_hours = response.get('working_hours', {})
            
            if not working_hours:
                print("   ❌ No working_hours in response")
                return False
            
            # Check default Monday-Friday schedule
            weekday_defaults_correct = True
            for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']:
                day_data = working_hours.get(day, {})
                if not (day_data.get('is_working') == True and 
                       day_data.get('start_time') == "09:00" and 
                       day_data.get('end_time') == "17:00"):
                    weekday_defaults_correct = False
                    break
            
            # Check weekend defaults
            weekend_defaults_correct = True
            for day in ['saturday', 'sunday']:
                day_data = working_hours.get(day, {})
                if day_data.get('is_working') != False:
                    weekend_defaults_correct = False
                    break
            
            if weekday_defaults_correct and weekend_defaults_correct:
                print("   ✅ Default working hours correctly applied")
                return True
            else:
                print("   ❌ Default working hours not correctly applied")
                return False
        
        return False

    def test_integration_workflow(self):
        """Test complete workflow: create staff → update working hours → add closure dates → retrieve all data"""
        print("\n🔍 Testing Complete Integration Workflow...")
        
        # Step 1: Create new staff member
        workflow_staff_data = {
            "name": "Integration Test Staff",
            "color_tag": "#FF5722"
        }
        
        success1, response1 = self.run_test(
            "Workflow Step 1 - Create Staff",
            "POST",
            "staff",
            200,
            data=workflow_staff_data
        )
        
        if not success1:
            return False
        
        workflow_staff_id = response1.get('id')
        print(f"   Step 1 ✅ - Staff created: {workflow_staff_id}")
        
        # Step 2: Update working hours
        custom_schedule = {
            "monday": {"is_working": True, "start_time": "08:30", "end_time": "17:30"},
            "tuesday": {"is_working": True, "start_time": "08:30", "end_time": "17:30"},
            "wednesday": {"is_working": True, "start_time": "08:30", "end_time": "17:30"},
            "thursday": {"is_working": True, "start_time": "08:30", "end_time": "17:30"},
            "friday": {"is_working": True, "start_time": "08:30", "end_time": "16:00"},
            "saturday": {"is_working": False, "start_time": None, "end_time": None},
            "sunday": {"is_working": False, "start_time": None, "end_time": None}
        }
        
        success2, response2 = self.run_test(
            "Workflow Step 2 - Update Working Hours",
            "PUT",
            f"staff/{workflow_staff_id}/working-hours",
            200,
            data=custom_schedule
        )
        
        if not success2:
            return False
        
        print("   Step 2 ✅ - Working hours updated")
        
        # Step 3: Add closure dates
        closures_to_add = [
            {
                "date": "2025-08-15",
                "reason": "Sommerferien",
                "all_day": True
            },
            {
                "date": "2025-09-10",
                "reason": "Zahnarzttermin",
                "all_day": False,
                "start_time": "10:00",
                "end_time": "12:00"
            }
        ]
        
        closure_ids = []
        for i, closure_data in enumerate(closures_to_add):
            success3, response3 = self.run_test(
                f"Workflow Step 3.{i+1} - Add Closure",
                "POST",
                f"staff/{workflow_staff_id}/closures",
                200,
                data=closure_data
            )
            
            if success3:
                closure_ids.append(response3.get('id'))
        
        if len(closure_ids) != 2:
            print("   Step 3 ❌ - Failed to create closures")
            return False
        
        print("   Step 3 ✅ - Closure dates added")
        
        # Step 4: Retrieve and verify all data
        success4, staff_response = self.run_test(
            "Workflow Step 4.1 - Get Updated Staff",
            "GET",
            "staff",
            200
        )
        
        if not success4:
            return False
        
        # Find our workflow staff
        workflow_staff = None
        for staff in staff_response:
            if staff.get('id') == workflow_staff_id:
                workflow_staff = staff
                break
        
        if not workflow_staff:
            print("   Step 4.1 ❌ - Workflow staff not found")
            return False
        
        # Verify working hours are correct
        working_hours = workflow_staff.get('working_hours', {})
        friday_correct = (working_hours.get('friday', {}).get('end_time') == "16:00")
        
        if not friday_correct:
            print("   Step 4.1 ❌ - Working hours not correctly updated")
            return False
        
        print("   Step 4.1 ✅ - Staff data retrieved with correct working hours")
        
        # Step 4.2: Get closures
        success5, closures_response = self.run_test(
            "Workflow Step 4.2 - Get Staff Closures",
            "GET",
            f"staff/{workflow_staff_id}/closures",
            200
        )
        
        if not success5:
            return False
        
        # Verify closures
        if len(closures_response) >= 2:
            summer_closure = any(c.get('reason') == 'Sommerferien' for c in closures_response)
            dentist_closure = any(c.get('reason') == 'Zahnarzttermin' for c in closures_response)
            
            if summer_closure and dentist_closure:
                print("   Step 4.2 ✅ - Closures retrieved correctly")
            else:
                print("   Step 4.2 ❌ - Closures not found")
                return False
        else:
            print("   Step 4.2 ❌ - Insufficient closures found")
            return False
        
        # Step 5: Clean up
        for closure_id in closure_ids:
            self.run_test(
                "Workflow Cleanup - Delete Closure",
                "DELETE",
                f"staff/{workflow_staff_id}/closures/{closure_id}",
                200
            )
        
        print("   Step 5 ✅ - Cleanup completed")
        print("   🎉 Complete integration workflow successful!")
        
        return True

    def run_all_tests(self):
        """Run all staff opening hours and special closure tests"""
        print("🚀 Starting Staff Opening Hours and Special Closure Dates Testing...")
        print("=" * 80)
        
        # Setup
        if not self.setup_test_environment():
            print("❌ Failed to setup test environment")
            return False
        
        # Test categories
        test_methods = [
            # Staff Working Hours API Testing
            self.test_staff_creation_with_default_hours,
            self.test_get_staff_with_working_hours,
            self.test_update_staff_working_hours,
            self.test_general_staff_update,
            self.test_staff_working_hours_with_custom_schedule,
            
            # Special Closure Dates API Testing
            self.test_special_closure_dates_creation,
            self.test_get_staff_closures,
            self.test_get_all_closures,
            self.test_delete_closure_dates,
            
            # Data Structure Validation
            self.test_date_format_validation,
            
            # Authorization & Tenant Isolation
            self.test_authorization_and_tenant_isolation,
            
            # Backward Compatibility
            self.test_backward_compatibility,
            
            # Integration Testing
            self.test_integration_workflow
        ]
        
        # Run tests
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Test {test_method.__name__} failed with exception: {str(e)}")
                self.tests_run += 1
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 STAFF OPENING HOURS & SPECIAL CLOSURES TEST SUMMARY")
        print("=" * 80)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = StaffHoursAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)