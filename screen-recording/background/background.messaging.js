var runtimePort;

chrome.runtime.onConnect.addListener(function(port) {
    runtimePort = port;

    chrome.downloads.onChanged.addListener(function(e) {
        if (!e.state) {
            return;
        }

        if (e.state.current === 'complete') {
            chrome.downloads.search({id: e.id}, function(items) {
                port.postMessage({
                    messageFromContentScript1234: true,
                    stoppedRecording: true,
                    downloadPath: items[0].filename,
                    downloadSize: items[0].fileSize,
                    downloadMime: items[0].mime,
                });
            })
        }

        if (e.satate.current === 'interrupted') {
            port.postMessage({
                messageFromContentScript1234: true,
                failedRecording: true,
            });
        }
    })

    runtimePort.onMessage.addListener(function(message) {
        if (!message || !message.messageFromContentScript1234) {
            return;
        }

        if (message.startRecording) {
            if(message.onlyMicrophone && enableCamera) {
                message.startRecording = false;
                message.stopRecording = true;
                alert('Unable to access camera device.');
                setDefaults();
                return;
            }
        }

        if (message.startRecording) {
            if(message.dropdown) {
                openPreviewOnStopRecording = true;
                openCameraPreviewDuringRecording = true;
            }

            if (isRecording && message.dropdown) {
                stopScreenRecording();
                return;
            }

            if(message.RecordRTC_Extension) {
                openPreviewOnStopRecording = false;
                openCameraPreviewDuringRecording = false;
                
                enableTabCaptureAPI = message['enableTabCaptureAPI'] === true;
                enableTabCaptureAPIAudioOnly = message['enableTabCaptureAPIAudioOnly'] === true;
                enableScreen = message['enableScreen'] === true;
                enableMicrophone = message['enableMicrophone'] === true;
                enableCamera = message['enableCamera'] === true;
                enableSpeakers = message['enableSpeakers'] === true;
                fixVideoSeekingIssues = message['fixVideoSeekingIssues'] === true;
                width = Number.isInteger(message['width']) ? message['width'] : 1920;
                height = Number.isInteger(message['height']) ? message['height'] : 1080;
                sendBlobInMessage = 'sendBlobInMessage' in message ? message['sendBlobInMessage'] === true : true;
                saveFileAsDownload = 'sendBlobInMessage' in message ? message['saveFileAsDownload'] === true : false;
                saveFileName = 'saveFileName' in message ? message['saveFileName'] : null;
                videoCodec = 'videoCodec' in message ? message['videoCodec'] : 'Default';
                bitsPerSecond = 'bitsPerSecond' in message ? message['bitsPerSecond'] : 8000000000;
                videoMaxFrameRates = 'videoMaxFrameRates' in message ? message['videoMaxFrameRates'] : 60;

                startRecordingCallback = function(file) {
                    port.postMessage({
                        messageFromContentScript1234: true,
                        startedRecording: true
                    });
                };

                chrome.storage.sync.set({
                    enableTabCaptureAPI: enableTabCaptureAPI ? 'true' : 'false',
                    enableTabCaptureAPIAudioOnly: enableTabCaptureAPIAudioOnly ? 'true' : 'false',
                    enableMicrophone: enableMicrophone ? 'true' : 'false',
                    enableCamera: enableCamera ? 'true' : 'false',
                    enableScreen: enableScreen ? 'true' : 'false',
                    enableSpeakers: enableSpeakers ? 'true' : 'false',
                    fixVideoSeekingIssues: fixVideoSeekingIssues ? 'true' : 'false',
                    videoResolutions: `${width}x${height}`,
                    isRecording: 'true',
                    sendBlobInMessage: sendBlobInMessage ? 'true' : 'false',
                    saveFileAsDownload: saveFileAsDownload ? 'true' : 'false',
                    saveFileName: saveFileName ? `${saveFileName}` : 'null',
                    videoCodec: videoCodec,
                    bitsPerSecond: bitsPerSecond,
                    videoMaxFrameRates: videoMaxFrameRates,
                }, function() {
                    getUserConfigs();
                });
                return;
            }

            getUserConfigs();
            return;
        }

        if (message.stopRecording) {
            if(message.RecordRTC_Extension) {
                stopRecordingCallback = function(file) {
                    if (saveFileAsDownload) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(file),
                            filename: saveFileName,
                            saveAs: false,
                            conflictAction: 'overwrite',
                        });
                    }

                    if (sendBlobInMessage) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            port.postMessage({
                                messageFromContentScript1234: true,
                                stoppedRecording: true,
                                file: e.target.result
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }

            stopScreenRecording();
            return;
        }
    });
});
