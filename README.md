# Introduction

This starter project showcases a digital twin of a bladeless wind turbine, simulating its oscillations and how those vibrations generate electricity via electromagnetic induction adn vortex induced vibrations (VIV). An integrated fluid‐dynamics view visualizes vortex shedding — showing how airflow past the turbine creates alternating vortices. Try out this demo to see both aerodynamic phenomena in action.

This is a short demo:

![demo](https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTVjcm5iZXRmY2N6cnJmMGxtajZhdmNta2Y2MHVtZGprd3pmMHl5eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tPJ1HNShtRuEeqDroU/giphy.gif)


# How to Run the Project

### Windows

If you are using a laptop computer, it is recommended to insert your charging cable to speed it up.

1. Install [Docker](https://www.docker.com/)
2. After installation, make sure that Docker is running.
3. Clone [this](https://github.com/adomas-vensas/BWT) repository.
4. In the same folder, where this repository resides, copy the backend code from [this](https://github.com/adomas-vensas/BWT_BACKEND) repository.
   The folder structure should be like this:
   ```
    someFolder/
    ├── BWT/
    ├── BWT_BACKEND/
   ```
6. Navigate to the BWT folder.
7. Run the following script:
   ```
   .\runservices.bat <PORT1> <PORT2>
   ```
   where PORT1 - frontend port, PORT2 - backend port.
8. Wait for the containers to build.
9. Launch the frontend service in your browser:
   ```
   http://localhost:<PORT1>
   ```
10. Wait for the calculations to load.
11. Experiment.
