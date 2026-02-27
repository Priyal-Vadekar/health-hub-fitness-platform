import React, { useState, useEffect } from "react";
import "../../css/Workout.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Workouts = ({ workoutId, titleOverride }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [exerciseSteps, setExerciseSteps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/workouts/${workoutId}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          setTitle(titleOverride || data.data.title || "Workout Exercises");
          setExercises(data.data.exercises || []);
        } else {
          console.error("Unexpected API response:", data);
          setExercises([]);
        }
      } catch (error) {
        console.error("Error fetching exercises:", error);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [workoutId, titleOverride]);

  const openVideoModal = (videoUrl, steps) => {
    let videoId = null;

    try {
      const url = new URL(videoUrl);
      if (
        url.hostname.includes("youtube.com") ||
        url.hostname.includes("youtu.be")
      ) {
        if (url.pathname.includes("/watch")) {
          videoId = url.searchParams.get("v");
        } else if (url.pathname.includes("/shorts/")) {
          videoId = url.pathname.split("/shorts/")[1].split("?")[0];
        } else if (url.hostname === "youtu.be") {
          videoId = url.pathname.substring(1);
        }
      }
    } catch (error) {
      console.error("Invalid video URL:", videoUrl);
    }

    if (videoId) {
      setSelectedVideo(`https://www.youtube.com/embed/${videoId}`);
      setExerciseSteps(steps);
    } else {
      toast.warn("Invalid or unsupported YouTube URL.");
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setExerciseSteps(null);
  };

  if (loading) return <p>Loading exercises...</p>;

  return (
    <div className="workout-container">
      <h2 className="heading">{title}</h2>

      <div className="exercise-container">
        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-card">
            <img src={exercise.image} alt={exercise.name} className="image" />
            <h3 className="title">{exercise.name}</h3>
            <p className="p description">{exercise.description}</p>
            <p className="p">
              <strong>Sets:</strong> {exercise.sets}
            </p>
            <p className="p">
              <strong>{exercise.reps ? "Reps" : "Duration"}:</strong>{" "}
              {exercise.reps || exercise.duration}
            </p>
            {exercise.tips && (
              <p className="p">
                <strong>Tips:</strong> {exercise.tips}
              </p>
            )}

            {exercise.videoUrl && (
              <div className="how-to-container">
                <button
                  onClick={() =>
                    openVideoModal(exercise.videoUrl, exercise.steps)
                  }
                  className="button"
                >
                  How to Do this Exercise
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="modal-overlay" onClick={closeVideoModal}>
          <div
            className="workout-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              width="100%"
              height="400"
              src={selectedVideo}
              title="Exercise Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="modal-steps">
              <h4 className="modal-steps-title">
                <br />
                Steps to Do this Exercise:
              </h4>
              <ol className="modal-steps-list">
                {exerciseSteps.map((step, index) => (
                  <li key={index} className="modal-steps-item">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <button onClick={closeVideoModal} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
