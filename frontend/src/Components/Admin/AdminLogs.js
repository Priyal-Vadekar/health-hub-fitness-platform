import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from "@mui/material";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/logs")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.error("Unexpected response format:", data);
          setLogs([]); // Prevent errors in .map()
        }
      })
      .catch((error) => console.error("Error fetching logs:", error));
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        gutterBottom
        margin="0px 0px 7px 40px"
      >
        <br /> System Logs <br />
        <br />
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, boxShadow: 3, maxWidth: "90%", margin: "auto" }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Level</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow
                key={index}
                sx={{ backgroundColor: index % 2 ? "#fafafa" : "white" }}
              >
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.level.toUpperCase()}
                    color={log.level === "error" ? "error" : "primary"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminLogs;
