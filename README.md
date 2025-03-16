#  Healthcare Translation App

## Overview

Healthcare Translation App is a web app that
- enables real-time, multilingual translation between patients and healthcare providers.
- converts spoken input into text
- provides a live transcript 
- offer a translated version with audio playback

## Technologies used

- The front end was built using React Js and Tailwind CSS 
- The backend was developed using Flask, you can find it [here](https://github.com/Joshuailuma/Translation-Backend).
- Google speech to text API is used to convert spoken speech to text
- Google Translate API is used to texts from one language to another
- Google Text to Speech API is used to convert texts to speech
- The app accept audio files of these formats - wav, webm, mp4, m4a, converts them to wav to be processed by Google.

## How to run the project locally

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


## How to use the project
- Register with a username a password
- Login with the registered username and password
- Select the input language and target language of choice
- Click the "Start recording" button
- Say a few words
- Click "Stop recording"
- View your transcript and translation transcript
- Play the audio file to hear the translated words
