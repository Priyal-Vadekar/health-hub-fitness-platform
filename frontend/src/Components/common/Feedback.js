import React from "react";

export const Feedback = () => {
  return (
    <div>
      <div className="container">
        <div
          className="row justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <div className="col-md-6">
            <div className="form-container">
              <div className="logo text-center mb-3">
                <h2>Feedback</h2>
              </div>
              <form action="#">
                <div className="mb-3 form-field">
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    placeholder="Enter Your Name"
                    required=""
                  />
                </div>
                <div className="mb-3">
                  <input
                    className="form-control"
                    type="file"
                    id="File"
                    required=""
                  />
                </div>
                <div className="mb-3 form-check">
                  <textarea
                    className="form-control"
                    placeholder="Leave a comment here"
                    name="feedback"
                    id="feedback"
                    required=""
                    defaultValue={""}
                  />
                </div>
                <div className="mb-3 form-field">
                  <input
                    type="text"
                    className="form-control"
                    id="profession"
                    name="profession"
                    placeholder="Enter Your profession"
                    required=""
                  />
                </div>
                <input
                  type="submit"
                  className="btn btn-info"
                  defaultValue="Submit"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
