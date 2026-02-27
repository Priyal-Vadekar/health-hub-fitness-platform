// import React, { useState, useEffect } from 'react';
// import "../../css/DietPlan.css"; // Ensure the correct CSS is imported

// const DietPlan = () => {
//   const [selectedOption, setSelectedOption] = useState('');
//   const [dietPlans, setDietPlans] = useState([]);
//   const token = localStorage.getItem('auth'); // Fetch the token from local storage

//   useEffect(() => {
//     const fetchDietPlans = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/diet-plans/all-diet-plans', {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         const data = await response.json();

//         if (Array.isArray(data)) {
//           setDietPlans(data);
//           // Auto-select the first category
//           if (data.length > 0) {
//             const defaultCategory = data[0].category.toLowerCase().replace(/ /g, '-');
//             setSelectedOption(defaultCategory);
//           }
//         } else {
//           console.error("Expected an array of diet plans, but got:", data);
//         }
//       } catch (error) {
//         console.error('Error fetching diet plans:', error);
//       }
//     };

//     if (token) {
//       fetchDietPlans();
//     }
//   }, [token]);

//   const getDietPlanByCategory = (category) => {
//     return dietPlans.find(plan =>
//       plan.category.toLowerCase().replace(/ /g, '-') === category
//     );
//   };

//   const renderDietSections = (plan) => {
//     if (!plan || !Array.isArray(plan.meals)) return null;
//     return plan.meals.map((meal, index) => (
//       <section key={index} className="diet-section">
//         <h3>{meal.timeOfDay}</h3>
//         <ul>
//           {meal.items.map((item, idx) => (
//             <li key={idx}>{item}</li>
//           ))}
//         </ul>
//       </section>
//     ));
//   };

//   return (
//     <div className="diet-container">
//       <h1 className="diet-heading">Diet Plans</h1>

//       {/* Dynamic Option Buttons */}
//       <div className="diet-options">
//         {dietPlans.map((plan, index) => {
//           const formattedCategory = plan.category.toLowerCase().replace(/ /g, '-');
//           return (
//             <button
//               key={index}
//               onClick={() => setSelectedOption(formattedCategory)}
//               className="diet-btn"
//             >
//               {plan.category}
//             </button>
//           );
//         })}
//       </div>

//       {/* Render Selected Diet Plan */}
//       {selectedOption && getDietPlanByCategory(selectedOption) ? (
//         <div className="diet-plan-card">
//           <h2 className="diet-plan-title">
//             {getDietPlanByCategory(selectedOption).category}
//           </h2>
//           {renderDietSections(getDietPlanByCategory(selectedOption))}
//         </div>
//       ) : (
//         <p className="diet-plan-message">No diet plan available for selected category.</p>
//       )}
//     </div>
//   );
// };

// export default DietPlan;

import React, { useState, useEffect } from "react";
import "../../css/DietPlan.css"; // Ensure the correct CSS is imported

const DietPlan = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [dietPlans, setDietPlans] = useState([]);
  const token = localStorage.getItem("auth"); // Fetch the token from local storage

  // useEffect(() => {
  //   const fetchDietPlans = async () => {
  //     try {
  //       const response = await fetch(
  //         "http://localhost:5000/api/diet-plans/all-diet-plans",
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       const data = await response.json();

  //       if (Array.isArray(data)) {
  //         setDietPlans(data);
  //         // Auto-select the first category
  //         if (data.length > 0) {
  //           const defaultCategory = data[0].category
  //             .toLowerCase()
  //             .replace(/ /g, "-");
  //           setSelectedOption(defaultCategory);
  //         }
  //       } else {
  //         console.error("Expected an array of diet plans, but got:", data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching diet plans:", error);
  //     }
  //   };

  //   if (token) {
  //     fetchDietPlans();
  //   }
  // }, [token]);

  useEffect(() => {
    const fetchDietPlans = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/diet-plans/all-diet-plans",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setDietPlans(result.data);

          if (result.data.length > 0) {
            const defaultCategory = result.data[0].category
              .toLowerCase()
              .replace(/ /g, "-");
            setSelectedOption(defaultCategory);
          }
        } else {
          console.error("Invalid response structure:", result);
        }
      } catch (error) {
        console.error("Error fetching diet plans:", error);
      }
    };

    if (token) fetchDietPlans();
  }, [token]);

  const getDietPlanByCategory = (category) => {
    return dietPlans.find(
      (plan) => plan.category.toLowerCase().replace(/ /g, "-") === category
    );
  };

  const renderDietSections = (plan) => {
    if (!plan || !Array.isArray(plan.meals)) return null;
    return plan.meals.map((meal, index) => (
      <section key={index} className="diet-section">
        <h3>{meal.timeOfDay}</h3>
        <ul>
          {meal.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    ));
  };

  // Download Function
  const handleDownloadPDF = async (planId) => {
    if (!planId) {
      console.error("❌ No planId provided for download");
      return;
    }

    console.log("🔄 Downloading PDF for planId:", planId);

    let token = localStorage.getItem("auth");
    if (!token) return;

    // Remove quotes if they exist
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }

    token = token.trim();

    try {
      const response = await fetch(
        `http://localhost:5000/api/diet-plans/${planId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ Remove Content-Type for binary response
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();

      if (blob.type !== "application/pdf") {
        console.error("Downloaded file is not a PDF!", blob.type);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DietPlan-${planId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log(blob.type); // should print 'application/pdf'
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="diet-container">
      <h1 className="diet-heading">Diet Plans</h1>

      {/* Dynamic Option Buttons */}
      <div className="diet-options">
        {dietPlans.map((plan, index) => {
          const formattedCategory = plan.category
            .toLowerCase()
            .replace(/ /g, "-");
          return (
            <button
              key={index}
              onClick={() => setSelectedOption(formattedCategory)}
              className="diet-btn"
            >
              {plan.category}
            </button>
          );
        })}
      </div>

      {/* Render Selected Diet Plan */}
      {selectedOption && getDietPlanByCategory(selectedOption) ? (
        <div className="diet-plan-card">
          <h2 className="diet-plan-title">
            {getDietPlanByCategory(selectedOption).category}
          </h2>
          {renderDietSections(getDietPlanByCategory(selectedOption))}

          {/* Download Button */}
          <button
            className="download-btn"
            onClick={() =>
              handleDownloadPDF(getDietPlanByCategory(selectedOption)._id)
            }
          >
            Download PDF
          </button>
        </div>
      ) : (
        <p className="diet-plan-message">
          No diet plan available for selected category.
        </p>
      )}
    </div>
  );
};

export default DietPlan;
