import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import TablePagination from "@mui/material/TablePagination";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import userService from "../services/userService";
import { getPayPeriodDates } from "../utils/dateUtils"; // Import your utility function
import timesheetService from "../services/apiService"; // Import the service
import InputAdornment from "@mui/material/InputAdornment";

function EmployeeTimesheet() {
  const [page, setPage] = useState(0);
  const [weeks, setWeeks] = useState([]);
  const [hoursWorked, setHoursWorked] = useState({});
  const [userData, setUserData] = useState(null);

  // Calculate the most recent Sunday as the pay period start
  const getMostRecentSunday = () => {
    const today = new Date(); // Current date
    const offset = (today.getDay() + 6) % 7; // Days since last Sunday (Sunday = 0)
    const mostRecentSunday = new Date(today);
    mostRecentSunday.setDate(today.getDate() - offset); // Move back to the correct Sunday
    return mostRecentSunday;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await userService.getUserData();
        setUserData(user);

        // Dynamically calculate start date
        const startDate = getMostRecentSunday().toISOString().split("T")[0]; // YYYY-MM-DD format
        const generatedWeeks = getPayPeriodDates(startDate);
        setWeeks(generatedWeeks);

        // Initialize hoursWorked state based on generated weeks
        const initialHoursWorked = generatedWeeks
          .flatMap((week) => week.dates)
          .reduce((acc, row) => ({ ...acc, [row.date]: 0 }), {});
        setHoursWorked(initialHoursWorked);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleHoursChange = (date, value) => {
    setHoursWorked((prev) => ({
      ...prev,
      [date]: value,
    }));
  };

  const totalHoursForCurrentPage = weeks[page]?.dates.reduce(
    (total, row) => total + parseFloat(hoursWorked[row.date] || 0),
    0
  );

  const grandTotalHours = Object.values(hoursWorked).reduce(
    (total, value) => total + parseFloat(value || 0),
    0
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const payPeriodStartDate = weeks[0]?.dates[0]?.date;
  const payPeriodEndDate = weeks[1]?.dates[6]?.date;

  if (!userData || weeks.length === 0) {
    return <Typography>Loading...</Typography>; // Show loading state
  }
  const handleSubmit = async () => {
    // Prepare the timesheet payload
    const payload = {
      userId: userData._id, // Assuming your backend uses the user's ID
      firstName: userData.firstName,
      lastName: userData.lastName,
      wNum: userData.wNum,
      group: userData.group,
      role: userData.role,
      fund: userData.fund,
      dept: userData.dept,
      program: userData.program,
      acct: userData.acct,
      project: userData.project,
      payPeriodStartDate,
      payPeriodEndDate,
      hourlyRate: userData.hourlyRate,
      isCasual: userData.assignmentType === "Casual",
      contractEndDate: userData.contractEndDate,
      week1: weeks[0].dates.map((row) => ({
        day: row.day.toLowerCase(), // Convert the day to lowercase
        hours: parseFloat(hoursWorked[row.date] || 0), // Ensure hours are numbers
        info: "", // Include additional info if needed
      })),
      week2: weeks[1].dates.map((row) => ({
        day: row.day.toLowerCase(), // Convert the day to lowercase
        hours: parseFloat(hoursWorked[row.date] || 0), // Ensure hours are numbers
        info: "",
      })),
    };
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/timesheets/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('PDF generated:', data.pdfUrl);
        window.location.href = data.pdfUrl; // Trigger download
      } else {
        console.error('Error generating PDF:', data.error);
      }
    } catch (error) {
      console.error('Error during submission:', error);
    }
  
    try {
      // Submit the payload using the service
      const response = await timesheetService.createTimesheet(payload);
      console.log("Timesheet created successfully:", response);
      alert("Timesheet submitted successfully!");
    } catch (error) {
      console.error("Error submitting timesheet:", error);
      alert("Failed to submit timesheet. Please try again.");
    };
  }
  
  return (
    <Box sx={{ padding: "20px", marginTop: "250px" }}>
      {/* User Data Section */}
      <Box
        sx={{
          marginBottom: 4,
          padding: 2,
          border: "1px solid #d9d9d9",
          borderRadius: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 2,
        }}
      >
        <Box sx={{ gridColumn: "span 6" }}>
          <Typography variant="h6">Employee Name:</Typography>
          <Typography>{userData.firstName} {userData.lastName}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 6" }}>
          <Typography variant="h6">W#:</Typography>
          <Typography>{userData.wNum}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 1" }}>
          <Typography variant="h6">Fund:</Typography>
          <Typography>{userData.fund}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 1" }}>
          <Typography variant="h6">Dept:</Typography>
          <Typography>{userData.dept}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 1" }}>
          <Typography variant="h6">Program:</Typography>
          <Typography>{userData.program}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 1" }}>
          <Typography variant="h6">Acct:</Typography>
          <Typography>{userData.acct}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Typography variant="h6">Project:</Typography>
          <Typography>{userData.project}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Typography variant="h6">Pay Period Start Date:</Typography>
          <Typography>{payPeriodStartDate}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 4" }}>
          <Typography variant="h6">Pay Period End Date:</Typography>
          <Typography>{payPeriodEndDate}</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 6" }}>
          <Typography variant="h6">Hourly Rate:</Typography>
          <Typography>${userData.hourlyRate}/hr</Typography>
        </Box>
        <Box sx={{ gridColumn: "span 6" }}>
          <Typography variant="h6">Assignment Type:</Typography>
          <Typography>{userData.assignmentType}</Typography>
        </Box>
      </Box>

      {/* Week Header */}
      <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
        Week {weeks[page]?.weekNumber}
      </Typography>

      {/* Paginated Table */}
      <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
        <Table aria-label={`Week ${weeks[page]?.weekNumber} Timesheet`} sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", backgroundColor: "#d9e1f2" }}>Day</TableCell>
              <TableCell sx={{ fontWeight: "bold", backgroundColor: "#d9e1f2" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold", backgroundColor: "#d9e1f2" }}>Hours Worked</TableCell>
              <TableCell sx={{ fontWeight: "bold", backgroundColor: "#d9e1f2" }}>Other Information</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {weeks[page]?.dates.map((row) => (
              <TableRow key={row.date}>
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  <TextField
                    id={`hours-${row.date}`}
                    variant="outlined"
                    size="small"
                    type="number"
                    value={hoursWorked[row.date]}
                    onChange={(e) => handleHoursChange(row.date, e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField id={`info-${row.date}`} variant="outlined" size="small" placeholder="Enter details" />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                Week {weeks[page]?.weekNumber} Total
              </TableCell>
              <TableCell>
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  value={totalHoursForCurrentPage?.toFixed(2)}
                  disabled
                  InputProps={{
                    endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                  }}
                />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ textAlign: "center", marginTop: 4 }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={handleSubmit}
        >
          Submit Timesheet
        </button>
      </Box>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[7]}
        component="div"
        count={weeks.length * 7}
        rowsPerPage={7}
        page={page}
        onPageChange={handleChangePage}
      />

      {/* Grand Total Section */}
      <Box sx={{ textAlign: "right", marginTop: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Grand Total: {grandTotalHours.toFixed(2)} hrs
        </Typography>
      </Box>
    </Box>
    
  );
}

export default EmployeeTimesheet;
