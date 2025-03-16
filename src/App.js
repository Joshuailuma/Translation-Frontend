import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { ClipLoader } from "react-spinners";
import Auth from "./Auth";
import axiosInstance from "./axiosInstance";
const socket = io("https://prod.mobile.buildwithseamless.co");

function App() {
  const [user, setUser] = useState(localStorage.getItem("token"));
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [audio, setAudio] = useState(null);
  const [inputLanguage, setInputLanguage] = useState("en-US");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    socket.on("receive_translation", (data) => {
      setTranslatedText(data.translated_text);
      setLoading(false);
    });
  }, []);

  const startRecording = async () => {
    setLoading(true);
    setAudio(null);
     setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        sendAudioToBackend(audioBlob);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
      setLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("input_language", inputLanguage);

    try {
      const response = await axiosInstance.post("https://prod.mobile.buildwithseamless.co/speech-to-text", formData);
      setTranscript(response.data.transcript);
      sendTranslation(response.data.transcript);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to process audio.");
      setLoading(false);
    }
  };

  const sendTranslation = async (text) => {
    try {
      const response = await axiosInstance.post(
        "https://prod.mobile.buildwithseamless.co/translate",
        { text, target_language: targetLanguage }
      );
      setTranslatedText(response.data.translated_text);
      requestTextToSpeech(response.data.translated_text);
    } catch (error) {
      setError(error.response?.data?.error || "Translation failed.");
      setLoading(false);
    }
  };

  const requestTextToSpeech = async (text) => {
    try {
      const response = await axiosInstance.post(
        "https://prod.mobile.buildwithseamless.co/text-to-speech",
        { text, language_code: targetLanguage }
      );
      setAudio(`data:audio/mp3;base64,${response.data.audio}`);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || "Text-to-speech conversion failed.");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Healthcare Translation Web App</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>

        {/* Error Message Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative my-4">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 px-2 py-1 text-lg font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Record Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded-md font-semibold transition w-full sm:w-auto ${
              recording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center my-4">
            <ClipLoader color="#3b82f6" size={50} />
          </div>
        )}

        {/* Transcript Box */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Transcript:</h3>
          <p className="border border-gray-300 p-3 rounded-md bg-gray-50 min-h-[50px] text-gray-800">
            {transcript || "No transcript available"}
          </p>
        </div>

        {/* Translated Text */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Translated Text:</h3>
          <p className="border border-gray-300 p-3 rounded-md bg-gray-50 min-h-[50px] text-gray-800">
            {translatedText || "No translation available"}
          </p>
        </div>

        {/* Input Language Selection */}
                                <div className="mb-4">
                                  <label className="text-lg font-semibold text-gray-700 block mb-2">Input Language:</label>
                                  <select
                                    value={inputLanguage}
                                    onChange={(e) => setInputLanguage(e.target.value)}
                                    className="border border-gray-300 p-2 rounded-md w-full bg-white text-gray-800"
                                  >
                                    <option value="en">English</option>
                                                                <option value="es-US">Spanish</option>
                                                                <option value="fr">French</option>
                                                                <option value="de">German</option>
                                                                <option value="ab">Abkhaz</option>
                                                                <option value="ace">Acehnese</option>
                                                                <option value="ach">Acholi</option>
                                                                <option value="af">Afrikaans</option>
                                                                <option value="sq">Albanian</option>
                                                                <option value="alz">Alur</option>
                                                                <option value="am">Amharic</option>
                                                                <option value="ar">Arabic</option>
                                                                <option value="hy">Armenian</option>
                                                                <option value="as">Assamese</option>
                                                                <option value="awa">Awadhi</option>
                                                                <option value="ay">Aymara</option>
                                                                <option value="az">Azerbaijani</option>
                                                                <option value="ban">Balinese</option>
                                                                <option value="ba">Bashkir</option>
                                                                <option value="eu">Basque</option>
                                                                <option value="btx">Batak Karo</option>
                                                                <option value="bts">Batak Simalungun</option>
                                                                <option value="bbc">Batak Toba</option>
                                                                <option value="be">Belarusian</option>
                                                                <option value="bem">Bemba</option>
                                                                <option value="bn">Bengali</option>
                                                                <option value="bew">Betawi</option>
                                                                <option value="bho">Bhojpuri</option>
                                                                <option value="bik">Bikol</option>
                                                                <option value="bs">Bosnian</option>
                                                                <option value="br">Breton</option>
                                                                <option value="bg">Bulgarian</option>
                                                                <option value="bua">Buryat</option>
                                                                <option value="yue">Cantonese</option>
                                                                <option value="ca">Catalan</option>
                                                                <option value="ceb">Cebuano</option>
                                                                <option value="ny">Chichewa (Nyanja)</option>
                                                                <option value="zh-CN">Chinese (Simplified)</option>
                                                                <option value="zh-TW">Chinese (Traditional)</option>
                                                                <option value="cv">Chuvash</option>
                                                                <option value="co">Corsican</option>
                                                                <option value="crh">Crimean Tatar</option>
                                                                <option value="hr">Croatian</option>
                                                                <option value="cs">Czech</option>
                                                                <option value="da">Danish</option>
                                                                <option value="din">Dinka</option>
                                                                <option value="dv">Divehi</option>
                                                                <option value="doi">Dogri</option>
                                                                <option value="dov">Dombe</option>
                                                                <option value="nl">Dutch</option>
                                                                <option value="dz">Dzongkha</option>
                                                                <option value="eo">Esperanto</option>
                                                                <option value="et">Estonian</option>
                                                                <option value="ee">Ewe</option>
                                                                <option value="fj">Fijian</option>
                                                                <option value="fil">Filipino (Tagalog)</option>
                                                                <option value="tl">Filipino (Tagalog)</option>
                                                                <option value="fi">Finnish</option>
                                                                <option value="fr-FR">French (French)</option>
                                                                <option value="fr-CA">French (Canadian)</option>
                                                                <option value="fy">Frisian</option>
                                                                <option value="ff">Fulfulde</option>
                                                                <option value="gaa">Ga</option>
                                                                <option value="gl">Galician</option>
                                                                <option value="lg">Ganda (Luganda)</option>
                                                                <option value="ka">Georgian</option>
                                                                <option value="el">Greek</option>
                                                                <option value="gn">Guarani</option>
                                                                <option value="gu">Gujarati</option>
                                                                <option value="ht">Haitian Creole</option>
                                                                <option value="cnh">Hakha Chin</option>
                                                                <option value="ha">Hausa</option>
                                                                <option value="haw">Hawaiian</option>
                                                                <option value="iw">Hebrew</option>
                                                                <option value="he">Hebrew</option>
                                                                <option value="hil">Hiligaynon</option>
                                                                <option value="hi">Hindi</option>
                                                                <option value="hmn">Hmong</option>
                                                                <option value="hu">Hungarian</option>
                                                                <option value="hrx">Hunsrik</option>
                                                                <option value="is">Icelandic</option>
                                                                <option value="ig">Igbo</option>
                                                                <option value="ilo">Iloko</option>
                                                                <option value="id">Indonesian</option>
                                                                <option value="ga">Irish</option>
                                                                <option value="it">Italian</option>
                                                                <option value="ja">Japanese</option>
                                                                <option value="jw">Javanese</option>
                                                                <option value="jv">Javanese</option>
                                                                <option value="kn">Kannada</option>
                                                                <option value="pam">Kapampangan</option>
                                                                <option value="kk">Kazakh</option>
                                                                <option value="km">Khmer</option>
                                                                <option value="cgg">Kiga</option>
                                                                <option value="rw">Kinyarwanda</option>
                                                                <option value="ktu">Kituba</option>
                                                                <option value="gom">Konkani</option>
                                                                <option value="ko">Korean</option>
                                                                <option value="kri">Krio</option>
                                                                <option value="ku">Kurdish (Kurmanji)</option>
                                                                <option value="ckb">Kurdish (Sorani)</option>
                                                                <option value="ky">Kyrgyz</option>
                                                                <option value="lo">Lao</option>
                                                                <option value="ltg">Latgalian</option>
                                                                <option value="la">Latin</option>
                                                                <option value="lv">Latvian</option>
                                                                <option value="lij">Ligurian</option>
                                                                <option value="li">Limburgan</option>
                                                                <option value="ln">Lingala</option>
                                                                <option value="lt">Lithuanian</option>
                                                                <option value="lmo">Lombard</option>
                                                                <option value="luo">Luo</option>
                                                                <option value="lb">Luxembourgish</option>
                                                                <option value="mk">Macedonian</option>
                                                                <option value="mai">Maithili</option>
                                                                <option value="mak">Makassar</option>
                                                                <option value="mg">Malagasy</option>
                                                                <option value="ms">Malay</option>
                                                                <option value="ms-Arab">Malay (Jawi)</option>
                                                                <option value="ml">Malayalam</option>
                                                                <option value="mt">Maltese</option>
                                                                <option value="mi">Maori</option>
                                                                <option value="mr">Marathi</option>
                                                                <option value="chm">Meadow Mari</option>
                                                                <option value="mni-Mtei">Meiteilon (Manipuri)</option>
                                                                <option value="min">Minang</option>
                                                                <option value="lus">Mizo</option>
                                                                <option value="mn">Mongolian</option>
                                                                <option value="my">Myanmar (Burmese)</option>
                                                                <option value="nr">Ndebele (South)</option>
                                                                <option value="new">Nepalbhasa (Newari)</option>
                                                                <option value="ne">Nepali</option>
                                                                <option value="nso">Northern Sotho (Sepedi)</option>
                                                                <option value="no">Norwegian</option>
                                                                <option value="nus">Nuer</option>
                                                                <option value="oc">Occitan</option>
                                                                <option value="or">Odia (Oriya)</option>
                                                                <option value="om">Oromo</option>
                                                                <option value="pag">Pangasinan</option>
                                                                <option value="pap">Papiamento</option>
                                                                <option value="ps">Pashto</option>
                                                                <option value="fa">Persian</option>
                                                                <option value="pl">Polish</option>
                                                                <option value="pt">Portuguese</option>
                                                                <option value="pt-PT">Portuguese (Portugal)</option>
                                                                <option value="pt-BR">Portuguese (Brazil)</option>
                                                                <option value="pa">Punjabi</option>
                                                                <option value="pa-Arab">Punjabi (Shahmukhi)</option>
                                                                <option value="qu">Quechua</option>
                                                                <option value="rom">Romani</option>
                                                                <option value="ro">Romanian</option>
                                                                <option value="rn">Rundi</option>
                                                                <option value="ru">Russian</option>
                                                                <option value="sm">Samoan</option>
                                                                <option value="sg">Sango</option>
                                                                <option value="sa">Sanskrit</option>
                                                                <option value="gd">Scots Gaelic</option>
                                                                <option value="sr">Serbian</option>
                                                                <option value="st">Sesotho</option>
                                                                <option value="crs">Seychellois Creole</option>
                                                                <option value="shn">Shan</option>
                                                                <option value="sn">Shona</option>
                                                                <option value="scn">Sicilian</option>
                                                                <option value="szl">Silesian</option>
                                                                <option value="sd">Sindhi</option>
                                                                <option value="si">Sinhala (Sinhalese)</option>
                                                                <option value="sk">Slovak</option>
                                                                <option value="sl">Slovenian</option>
                                                                <option value="so">Somali</option>
                                                                <option value="su">Sundanese</option>
                                                                <option value="sw">Swahili</option>
                                                                <option value="ss">Swati</option>
                                                                <option value="sv">Swedish</option>
                                                                <option value="tg">Tajik</option>
                                                                <option value="ta">Tamil</option>
                                                                <option value="tt">Tatar</option>
                                                                <option value="te">Telugu</option>
                                                                <option value="tet">Tetum</option>
                                                                <option value="th">Thai</option>
                                                                <option value="ti">Tigrinya</option>
                                                                <option value="ts">Tsonga</option>
                                                                <option value="tn">Tswana</option>
                                                                <option value="tr">Turkish</option>
                                                                <option value="tk">Turkmen</option>
                                                                <option value="ak">Twi (Akan)</option>
                                                                <option value="uk">Ukrainian</option>
                                                                <option value="ur">Urdu</option>
                                                                <option value="ug">Uyghur</option>
                                                                <option value="uz">Uzbek</option>
                                                                <option value="vi">Vietnamese</option>
                                                                <option value="cy">Welsh</option>
                                                                <option value="xh">Xhosa</option>
                                                                <option value="yi">Yiddish</option>
                                                                <option value="yo">Yoruba</option>
                                                                <option value="yua">Yucatec Maya</option>
                                                                <option value="zu">Zulu</option>
                                  </select>
                                </div>

                        {/* Target Language Selection */}
                        <div className="mb-4">
                          <label className="text-lg font-semibold text-gray-700 block mb-2">Target Language:</label>
                          <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="border border-gray-300 p-2 rounded-md w-full bg-white text-gray-800"
                          >
                           <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ab">Abkhaz</option>
                            <option value="ace">Acehnese</option>
                            <option value="ach">Acholi</option>
                            <option value="af">Afrikaans</option>
                            <option value="sq">Albanian</option>
                            <option value="alz">Alur</option>
                            <option value="am">Amharic</option>
                            <option value="ar">Arabic</option>
                            <option value="hy">Armenian</option>
                            <option value="as">Assamese</option>
                            <option value="awa">Awadhi</option>
                            <option value="ay">Aymara</option>
                            <option value="az">Azerbaijani</option>
                            <option value="ban">Balinese</option>
                            <option value="ba">Bashkir</option>
                            <option value="eu">Basque</option>
                            <option value="btx">Batak Karo</option>
                            <option value="bts">Batak Simalungun</option>
                            <option value="bbc">Batak Toba</option>
                            <option value="be">Belarusian</option>
                            <option value="bem">Bemba</option>
                            <option value="bn">Bengali</option>
                            <option value="bew">Betawi</option>
                            <option value="bho">Bhojpuri</option>
                            <option value="bik">Bikol</option>
                            <option value="bs">Bosnian</option>
                            <option value="br">Breton</option>
                            <option value="bg">Bulgarian</option>
                            <option value="bua">Buryat</option>
                            <option value="yue">Cantonese</option>
                            <option value="ca">Catalan</option>
                            <option value="ceb">Cebuano</option>
                            <option value="ny">Chichewa (Nyanja)</option>
                            <option value="zh-CN">Chinese (Simplified)</option>
                            <option value="zh-TW">Chinese (Traditional)</option>
                            <option value="cv">Chuvash</option>
                            <option value="co">Corsican</option>
                            <option value="crh">Crimean Tatar</option>
                            <option value="hr">Croatian</option>
                            <option value="cs">Czech</option>
                            <option value="da">Danish</option>
                            <option value="din">Dinka</option>
                            <option value="dv">Divehi</option>
                            <option value="doi">Dogri</option>
                            <option value="dov">Dombe</option>
                            <option value="nl">Dutch</option>
                            <option value="dz">Dzongkha</option>
                            <option value="eo">Esperanto</option>
                            <option value="et">Estonian</option>
                            <option value="ee">Ewe</option>
                            <option value="fj">Fijian</option>
                            <option value="fil">Filipino (Tagalog)</option>
                            <option value="tl">Filipino (Tagalog)</option>
                            <option value="fi">Finnish</option>
                            <option value="fr-FR">French (French)</option>
                            <option value="fr-CA">French (Canadian)</option>
                            <option value="fy">Frisian</option>
                            <option value="ff">Fulfulde</option>
                            <option value="gaa">Ga</option>
                            <option value="gl">Galician</option>
                            <option value="lg">Ganda (Luganda)</option>
                            <option value="ka">Georgian</option>
                            <option value="el">Greek</option>
                            <option value="gn">Guarani</option>
                            <option value="gu">Gujarati</option>
                            <option value="ht">Haitian Creole</option>
                            <option value="cnh">Hakha Chin</option>
                            <option value="ha">Hausa</option>
                            <option value="haw">Hawaiian</option>
                            <option value="iw">Hebrew</option>
                            <option value="he">Hebrew</option>
                            <option value="hil">Hiligaynon</option>
                            <option value="hi">Hindi</option>
                            <option value="hmn">Hmong</option>
                            <option value="hu">Hungarian</option>
                            <option value="hrx">Hunsrik</option>
                            <option value="is">Icelandic</option>
                            <option value="ig">Igbo</option>
                            <option value="ilo">Iloko</option>
                            <option value="id">Indonesian</option>
                            <option value="ga">Irish</option>
                            <option value="it">Italian</option>
                            <option value="ja">Japanese</option>
                            <option value="jw">Javanese</option>
                            <option value="jv">Javanese</option>
                            <option value="kn">Kannada</option>
                            <option value="pam">Kapampangan</option>
                            <option value="kk">Kazakh</option>
                            <option value="km">Khmer</option>
                            <option value="cgg">Kiga</option>
                            <option value="rw">Kinyarwanda</option>
                            <option value="ktu">Kituba</option>
                            <option value="gom">Konkani</option>
                            <option value="ko">Korean</option>
                            <option value="kri">Krio</option>
                            <option value="ku">Kurdish (Kurmanji)</option>
                            <option value="ckb">Kurdish (Sorani)</option>
                            <option value="ky">Kyrgyz</option>
                            <option value="lo">Lao</option>
                            <option value="ltg">Latgalian</option>
                            <option value="la">Latin</option>
                            <option value="lv">Latvian</option>
                            <option value="lij">Ligurian</option>
                            <option value="li">Limburgan</option>
                            <option value="ln">Lingala</option>
                            <option value="lt">Lithuanian</option>
                            <option value="lmo">Lombard</option>
                            <option value="luo">Luo</option>
                            <option value="lb">Luxembourgish</option>
                            <option value="mk">Macedonian</option>
                            <option value="mai">Maithili</option>
                            <option value="mak">Makassar</option>
                            <option value="mg">Malagasy</option>
                            <option value="ms">Malay</option>
                            <option value="ms-Arab">Malay (Jawi)</option>
                            <option value="ml">Malayalam</option>
                            <option value="mt">Maltese</option>
                            <option value="mi">Maori</option>
                            <option value="mr">Marathi</option>
                            <option value="chm">Meadow Mari</option>
                            <option value="mni-Mtei">Meiteilon (Manipuri)</option>
                            <option value="min">Minang</option>
                            <option value="lus">Mizo</option>
                            <option value="mn">Mongolian</option>
                            <option value="my">Myanmar (Burmese)</option>
                            <option value="nr">Ndebele (South)</option>
                            <option value="new">Nepalbhasa (Newari)</option>
                            <option value="ne">Nepali</option>
                            <option value="nso">Northern Sotho (Sepedi)</option>
                            <option value="no">Norwegian</option>
                            <option value="nus">Nuer</option>
                            <option value="oc">Occitan</option>
                            <option value="or">Odia (Oriya)</option>
                            <option value="om">Oromo</option>
                            <option value="pag">Pangasinan</option>
                            <option value="pap">Papiamento</option>
                            <option value="ps">Pashto</option>
                            <option value="fa">Persian</option>
                            <option value="pl">Polish</option>
                            <option value="pt">Portuguese</option>
                            <option value="pt-PT">Portuguese (Portugal)</option>
                            <option value="pt-BR">Portuguese (Brazil)</option>
                            <option value="pa">Punjabi</option>
                            <option value="pa-Arab">Punjabi (Shahmukhi)</option>
                            <option value="qu">Quechua</option>
                            <option value="rom">Romani</option>
                            <option value="ro">Romanian</option>
                            <option value="rn">Rundi</option>
                            <option value="ru">Russian</option>
                            <option value="sm">Samoan</option>
                            <option value="sg">Sango</option>
                            <option value="sa">Sanskrit</option>
                            <option value="gd">Scots Gaelic</option>
                            <option value="sr">Serbian</option>
                            <option value="st">Sesotho</option>
                            <option value="crs">Seychellois Creole</option>
                            <option value="shn">Shan</option>
                            <option value="sn">Shona</option>
                            <option value="scn">Sicilian</option>
                            <option value="szl">Silesian</option>
                            <option value="sd">Sindhi</option>
                            <option value="si">Sinhala (Sinhalese)</option>
                            <option value="sk">Slovak</option>
                            <option value="sl">Slovenian</option>
                            <option value="so">Somali</option>
                            <option value="su">Sundanese</option>
                            <option value="sw">Swahili</option>
                            <option value="ss">Swati</option>
                            <option value="sv">Swedish</option>
                            <option value="tg">Tajik</option>
                            <option value="ta">Tamil</option>
                            <option value="tt">Tatar</option>
                            <option value="te">Telugu</option>
                            <option value="tet">Tetum</option>
                            <option value="th">Thai</option>
                            <option value="ti">Tigrinya</option>
                            <option value="ts">Tsonga</option>
                            <option value="tn">Tswana</option>
                            <option value="tr">Turkish</option>
                            <option value="tk">Turkmen</option>
                            <option value="ak">Twi (Akan)</option>
                            <option value="uk">Ukrainian</option>
                            <option value="ur">Urdu</option>
                            <option value="ug">Uyghur</option>
                            <option value="uz">Uzbek</option>
                            <option value="vi">Vietnamese</option>
                            <option value="cy">Welsh</option>
                            <option value="xh">Xhosa</option>
                            <option value="yi">Yiddish</option>
                            <option value="yo">Yoruba</option>
                            <option value="yua">Yucatec Maya</option>
                            <option value="zu">Zulu</option>

                          </select>
                        </div>

        {/* Audio Playback */}
        {audio && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700">Audio Playback:</h3>
            <audio controls className="w-full mt-2">
              <source src={audio} type="audio/mp3" />
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
