# Introduction

This starter project showcases a digital twin of a bladeless wind turbine. An integrated fluid‐dynamics view visualizes vortex shedding — showing how airflow past the turbine creates alternating vortices and those vortices induce the structure's vibrations (VIV). Try out this demo to see both aerodynamic phenomena in action.

These are some demos:

![real_time](https://media.giphy.com/media/n7uv6xDg39Cb4CVQ6P/giphy.gif)
![simulation](https://media.giphy.com/media/s5Kz8FArrjxKVc9mqt/giphy.gif)


# How to Run the Project

### Windows

If you are using a laptop computer, it is recommended to insert your charging cable to speed it up.

1. Install [Docker](https://www.docker.com/).
2. :bangbang: After installation, make sure that Docker is running.
3. Clone [this](https://github.com/adomas-vensas/BWT) repository.
4. In the same folder, where this repository resides, clone [this](https://github.com/adomas-vensas/BWT_BACKEND) repository.
   The folder structure should be like this:
   ```
    someFolder/
    ├── BWT/
    ├── BWT_BACKEND/
   ```
6. Open command prompt in the `BWT` folder and run the following script:
   ```
   .\runservices.bat <PORT1> <PORT2>
   ```
   where `PORT1` - frontend port, `PORT2` - backend port. Example: `.\runservices.bat 8444 7654`
7. Wait for the containers to build.
8. Launch the frontend service in your browser:
   ```
   http://localhost:<PORT1>
   ```
9. Wait for the calculations to load.
10. Experiment.
