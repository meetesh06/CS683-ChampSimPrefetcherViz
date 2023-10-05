import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { AppBar, Container, Divider, TextField, Toolbar, Typography } from '@mui/material';

import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';

import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

function arrayMin(arr) {
  var len = arr.length, min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
};

function arrayMax(arr) {
  var len = arr.length, max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
};


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function App() {

  const [mainData, setMainData] = useState([]);
  const [eventID, setEventID] = useState(0);
  const [sliderLimits, setSliderLimits] = useState([0,0]);
  const [addressesPerRow, setAddressesPerRow] = useState(150);

  const [canvasData, setCanvasData] = useState([1090,800]);
  const [loading, setLoading] = useState(false);

  const [eventData, setEventData] = useState(
    {
      EVENT_NAME: "NIL",
      ADDR: 0,
      IP: 0,
      TYPE: "NIL",
      CACHE_HIT: "NIL",
      CACHE_NAME: "NIL",
      CYCLE: 0,
    }
  );

  const [ASMR, setASMR] = useState(false);
  const [ASMRTimer, setASMRTimer] = useState(0);
  const [timePerEvent, setTimePerEvent] = useState(100);

  useEffect(() => {
    handlePlot()
  }, [eventID, addressesPerRow, mainData])

  const handlePlot = () => {
    if (!mainData.ADDR) return;
      let c = document.getElementById("myCanvas");
      let ctx = c.getContext("2d");
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvasData[0], canvasData[1]);

    let eventNameSubset = mainData["EVENT_NAME"].filter( (a ,index) => index <= eventID )
    let cacheHitSubset = mainData["CACHE_HIT"].filter( (a ,index) => index <= eventID )
    let addrSubset = mainData["ADDR"].filter( (a ,index) => index <= eventID )
    
    let addrClasses = {}



    setEventData({
      EVENT_NAME: mainData["EVENT_NAME"][eventID],
      ADDR: mainData["ADDR"][eventID],
      IP: mainData["IP"][eventID],
      TYPE: mainData["TYPE"][eventID],
      CACHE_HIT: mainData["CACHE_HIT"][eventID] === "0" ? "MISS" : "HIT",
      CACHE_NAME: mainData["CACHE_NAME"][eventID],
      CYCLE: mainData["CYCLE"][eventID],
    })

    let reverseMap = {}

    addrSubset.forEach((element, idx) => {
      reverseMap[element] = idx
      let classs = Math.floor(element/addressesPerRow)
      if (classs in addrClasses) {
        addrClasses[classs] = [...addrClasses[classs], element]
      } else {
        addrClasses[classs] = [element]
      }
    });


    let widthIncrement = (canvasData[0] - 90) / addressesPerRow
    let heightIncrement = canvasData[1] / Object.keys(addrClasses).length
    
    let row = 0
    
    for (const key in addrClasses) {
      if (addrClasses.hasOwnProperty(key)) {
        let coll = 0
        for (let plotCol = 0; plotCol < addressesPerRow; plotCol++) {
          let addrKey = plotCol + (parseInt(key) * addressesPerRow);
          if (addrKey in reverseMap) {
            ctx.fillStyle = "#08D9D6";
            ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
            let realIdx = reverseMap[addrKey]
            
            if (eventNameSubset[realIdx] === "CACHE_OPERATE") {
              if (cacheHitSubset[realIdx] === "1") {
                ctx.fillStyle = "#91C788";
                ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
              } else {
                ctx.fillStyle = "#C63D2F";
                ctx.fillRect(coll, row, widthIncrement * 0.9, heightIncrement * 0.9);
              }
              // ctx.fillStyle = "#08D9D6";
              // ctx.fillRect(coll + (widthIncrement * 0.25), row + (heightIncrement * 0.025), widthIncrement * 0.5, heightIncrement * 0.85);
            }
            if (realIdx == eventID) {
              ctx.beginPath();
              ctx.fillStyle = "black";
              ctx.arc(coll + ((widthIncrement * 0.9) / 2), row + ((heightIncrement * 0.9) / 2), 7, 0, 2 * Math.PI);
              ctx.fill(); 
              ctx.beginPath();
              ctx.fillStyle = "yellow";
              ctx.arc(coll + ((widthIncrement * 0.9) / 2), row + ((heightIncrement * 0.9) / 2), 5, 0, 2 * Math.PI);
              ctx.fill(); 
              ctx.fillStyle = "black";
              ctx.font = "18px mono";
              ctx.fillText(addrKey, coll + ((widthIncrement * 0.9) / 2), row + ((heightIncrement * 0.9) / 2) + 15); 
            }
          }

          coll += widthIncrement
        }
      }
      row += heightIncrement
    }
  }

  const handleFileChange = async (e) => {
    setLoading(true)
    if (e.target.files) {
      try {
        const file = e.target.files[0];
        const fileUrl = URL.createObjectURL(file);
        const response = await fetch(fileUrl);
        const text = await response.text();
        const lines = text.split("\n");
        const _data = lines.map((line) => line.split(","));
        let finalData = {}
        for (let i = 0; i < _data[0].length; i++) {
          finalData[_data[0][i].trim()] = []
        }
        for (let j = 1; j < _data.length; j++) {
          let currLine = _data[j]
          for (let i = 0; i < _data[0].length; i++) {
            finalData[_data[0][i].trim()] = [...finalData[_data[0][i].trim()], (_data[0][i].trim() == "ADDR" || _data[0][i].trim() == "CYCLE") ? parseInt(currLine[i]) : currLine[i]];
          }
        }
        setSliderLimits([0, finalData["CYCLE"].length - 2])
        setEventID(0)
        setMainData(finalData)
        setEventData({
          EVENT_NAME: finalData["EVENT_NAME"][eventID],
          ADDR: finalData["ADDR"][eventID],
          IP: finalData["IP"][eventID],
          TYPE: finalData["TYPE"][eventID],
          CACHE_HIT: finalData["CACHE_HIT"][eventID] === "0" ? "MISS" : "HIT",
          CACHE_NAME: finalData["CACHE_NAME"][eventID],
          CYCLE: finalData["CYCLE"][eventID],
        })
        handlePlot()
        

        console.log(finalData)
      } catch (error) {
        console.error(error);
      }
    }
    setLoading(false)
  };


  const handleASMR = () => {
    if (ASMR) {
      setASMR(false)
      clearInterval(ASMRTimer)
    } else {
      setASMR(true)
      let counter = eventID
      let max = mainData["CYCLE"].length - 1

      
      let interval = setInterval(() => {
        console.log("ASMR", counter)
        if (counter != max) {
          setEventID(counter)
          counter++
        }
      }, timePerEvent <= 0 ? 80 : timePerEvent )
      setASMRTimer(interval)
    }
  }
  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CS683 '23 - Meam viz
          </Typography>
        </Toolbar>
      </AppBar>
      <div style={{ padding: 10 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Item style={{ padding: 10 }}>
              {
                !mainData.ADDR &&
                <div>
                  <Typography variant='h6'>
                    Upload Trace
                  </Typography>
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                    Upload trace
                    <VisuallyHiddenInput type="file" accept=".csv" onChange={handleFileChange} />
                  </Button>
                  <Divider style={{ marginTop: 15, marginBottom: 15 }} />
                </div>
              }


              <div>
                <Typography variant='subtitle1' gutterBottom>
                  Cache Lines per row (<b>{addressesPerRow}</b>)
                </Typography>
                <Slider
                  type="range"
                  min={100}
                  max={2000}
                  onChange={(e) => setAddressesPerRow(e.target.value)}
                  value={addressesPerRow}
                />
              </div>
              <div>
                <Typography variant='body2' gutterBottom align='left'>
                  Each row shows <b>{addressesPerRow}</b> consecutive cache lines.
                  <br/>
                  If a memory region contains no accesses, its not shown! (this was more complicated to implement that it might sound).
                  Sadly for a given trace finding the optimal division factor is probably np-complete (or I am too sleepy). 
                  <br/>
                </Typography>
              </div>

              <div>
                <Typography variant='subtitle1' gutterBottom>
                  Event Id: {eventID}, Clock Cycle: {eventData.CYCLE}
                </Typography>
                <Slider
                  disabled={ASMR}
                  type="range"
                  min={sliderLimits[0]}
                  max={sliderLimits[1]}
                  onChange={(e) => setEventID(e.target.value)}
                  value={eventID}
                />
              </div>

              <Divider style={{ marginTop: 15, marginBottom: 15 }} />

              <TextField variant="filled" label="Time(ms)/Event" value={timePerEvent} onChange={(e) => setTimePerEvent(e.target.value)} />
              <Divider style={{ marginTop: 15, marginBottom: 15 }} />

              <Button onClick={handleASMR} >
                {!ASMR && "Start ASMR"}
                {ASMR && "Stop ASMR"}
              </Button>

              <div>
                <Typography variant='body2' gutterBottom>
                  ASMR is to let your prefetcher show off in style ;). The colors that it makes are strangely kind of relaxing :)
                  <br/>
                </Typography>
              </div>


              <Divider style={{ marginTop: 15, marginBottom: 15 }} />


              {mainData.ADDR && 
                <div style={{ textAlign: 'left' }}>
                  <JsonView data={eventData} shouldExpandNode={allExpanded} style={defaultStyles} />
                  <Divider style={{ marginTop: 15, marginBottom: 15 }} />
                </div>
              }

              <Typography variant='body2'>
                The definitive - <i>My prefetcher is doing what I think its doing proof ;)</i>
              </Typography>
            </Item>
          </Grid>
          <Grid item xs={8}>
            <Item style={{ padding: 10 }}>
                <canvas id="myCanvas" width={canvasData[0]} height={canvasData[1]}></canvas>
                {loading && <LinearProgress />}
                <i>_mee_</i>
            </Item>
          </Grid>
        </Grid>
      </div>

      
      
    </div>
  );
}

export default App;
