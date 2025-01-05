const axios2 = require("axios");

const BACKEND_URL = "http://localhost:3000" // backend server
const WS_URL = "ws://localhost:3001" // websocket server

const axios = {
    post: async (...args) => {
        try {
            const res = await axios2.post(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    get: async (...args) => {
        try {
            const res = await axios2.get(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    put: async (...args) => {
        try {
            const res = await axios2.put(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
    delete: async (...args) => {
        try {
            const res = await axios2.delete(...args)
            return res
        } catch(e) {
            return e.response
        }
    },
}

describe("Authentication", () => {
    test('User is able to sign up only once', async () => {
        const username = `olivia-${Math.random()}` // olivia-0.12312313
        const password = "123456";

        // Create a user with a POST HTTP request to backend server
        // Endpoint, or the route, we want to reach: /api/v1/user/signup
        // Data we want to send to the server: { username, password }
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        // Trying to sign up with the same username should fail
        expect(response.status).toBe(200)
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        expect(updatedResponse.status).toBe(400);
    });

    test('Signup request fails if the username is empty', async () => {
        const username = `olivia-${Math.random()}` // olivia-0.12312313
        const password = "123456"

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            password
        })

        expect(response.status).toBe(400)
    })

    test('Signin succeeds if the username and password are correct', async() => {
        const username = `olivia-${Math.random()}`
        const password = "123456"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        expect(response.status).toBe(200)
        expect(response.data.token).toBeDefined() // Sign-in event response also returns a token for the signed-in user
        
    })

    test('Signin fails if the username and password are incorrect', async() => {
        const username = `olivia-${Math.random()}`
        const password = "123456"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            role: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUsername",
            password
        })

        expect(response.status).toBe(403)
    })
})

describe("User metadata endpoint", () => {
    // run this code before all tests in this suite because 
    // all endpoints being tested in this suite need a token in the header, meaning
    // a user needs to have been signed in (before accessing user info)

    // global variables, can be used in all of tests
    let token = "";
    let avatarId = ""

    beforeAll(async () => {
       const username = `olivia-${Math.random()}`
       const password = "123456"

       await axios.post(`${BACKEND_URL}/api/v1/signup`, {
        username,
        password,
        type: "admin"
       });

       const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
        username,
        password
       })

       token = response.data.token

       const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                authorization: `Bearer ${token}`
            }
        })
        console.log("avatarresponse is " + avatarResponse.data.avatarId)

        avatarId = avatarResponse.data.avatarId;

    })

    test("User cant update their metadata with a wrong avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "123123123" // invalid avatar id that doesn't exist on server
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User can update their metadata with the right avatar id", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId // valid avatar id that exists on server
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200)
    })

    test("User is not able to update their metadata if the auth header is not present", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })

        expect(response.status).toBe(403)
    })

    test("test 3", () => {
        
    })
});

describe("User avatar information", () => {
    let avatarId;
    let token;
    let userId;

    beforeAll(async () => {
        const username = `olivia-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        userId = signupResponse.data.userId
 
        console.log("userid is " + userId)
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        token = response.data.token
 
        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
             "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
             "name": "Timmy"
         }, {
            headers: {
                authorization: `Bearer ${token}`
            }
         })
 
         avatarId = avatarResponse.data.avatarId;
 
    })

    test("Get back avatar information for a user", async () => {
        console.log("asking for user with id " + userId)
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);
        console.log("response was " + userId)
        console.log(JSON.stringify(response.data))
        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    })

    test("Available avatars lists the recently created avatar", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        expect(response.data.avatars.length).not.toBe(0);
        const currentAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined()
    })

})

describe("Space information", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `olivia-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })
    
        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id
        console.log(element2Id)
        console.log(element1Id)
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
         console.log("mapResponse.status")
         console.log(mapResponse.data.id)

         mapId = mapResponse.data.id

    });

    test("User is able to create a space", async () => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimensions": "100x200",
          "mapId": mapId
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })
       expect(response.status).toBe(200)
       expect(response.data.spaceId).toBeDefined()
    })

    test("User is able to create a space without mapId (empty space)", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
          "dimensions": "100x200",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })

       expect(response.data.spaceId).toBeDefined()
    })

    test("User is not able to create a space without mapId and dimensions", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
          "name": "Test",
       }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
       })

       expect(response.status).toBe(400)
    })

    test("User is not able to delete a space that doesnt exist", async () => {
        const response = await axios.delete(`${BACKEND_URL}/api/v1/space/randomIdDoesntExist`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

       expect(response.status).toBe(400)
    })

    test("User is able to delete a space that does exist", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

       expect(deleteReponse.status).toBe(200)
    })

    test("User should not be able to delete a space created by another user", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

       expect(deleteReponse.status).toBe(403)
    })

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0)
    })

    test("Admin has gets once space after", async () => {
        const spaceCreateReponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        console.log('jhflksdjflksdfjlksdfj')
        console.log(spaceCreateReponse.data)
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        const filteredSpace = response.data.spaces.find(x => x.id == spaceCreateReponse.data.spaceId)
        expect(response.data.spaces.length).toBe(1)
        expect(filteredSpace).toBeDefined()

    })
})

describe("Arena endpoints", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;
    let spaceId;

    beforeAll(async () => {
        const username = `olivia-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username: username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username  + "-user",
            password
        })
    
        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            name: "Default space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
         mapId = mapResponse.data.id

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
            "mapId": mapId
        }, {headers: {
            "authorization": `Bearer ${userToken}`
        }})
        console.log(spaceResponse.data)
        spaceId = spaceResponse.data.spaceId
    });

    test("Incorrect spaceId returns a 400", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/123kasdk01`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        expect(response.status).toBe(400)
    })

    test("Correct spaceId returns all the elements", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });
        console.log(response.data)
        expect(response.data.dimensions).toBe("100x200")
        expect(response.data.elements.length).toBe(3)
    })

    test("Delete endpoint is able to delete an element", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        console.log(response.data.elements[0].id )
        let res = await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
            data: {id: response.data.elements[0].id},
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });


        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(newResponse.data.elements.length).toBe(2)
    })

    test("Adding an element fails if the element lies outside the dimensions", async () => {
       const newResponse = await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            "elementId": element1Id,
            "spaceId": spaceId,
            "x": 10000,
            "y": 210000
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(newResponse.status).toBe(400)
    })

    test("Adding an element works as expected", async () => {
        await axios.post(`${BACKEND_URL}/api/v1/space/element`, {
            "elementId": element1Id,
            "spaceId": spaceId,
            "x": 50,
            "y": 20
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(newResponse.data.elements.length).toBe(3)
    })

})

describe("Admin Endpoints", () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `olivia-${Math.random()}`
        const password = "123456"
 
        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signupResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
         username: username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username  + "-user",
            password
        })
    
        userToken = userSigninResponse.data.token
    });

    test("User is not able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "test space",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/123`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(elementReponse.status).toBe(403)
        expect(mapResponse.status).toBe(403)
        expect(avatarResponse.status).toBe(403)
        expect(updateElementResponse.status).toBe(403)
    })

    test("Admin is able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "name": "Space",
            "dimensions": "100x200",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        expect(elementReponse.status).toBe(200)
        expect(mapResponse.status).toBe(200)
        expect(avatarResponse.status).toBe(200)
    })
 
    test("Admin is able to update the imageUrl for an element", async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })

        expect(updateElementResponse.status).toBe(200);

    })
});

describe("Websocket tests", () => {
    let adminToken;
    let adminUserId;
    let userToken;
    let adminId;
    let userId;
    let mapId;
    let element1Id;
    let element2Id;
    let spaceId;

    async function setupHTTP() {
        const username = `olivia-${Math.random()}`
        const password = "123456"
        const adminSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        const adminSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        adminUserId = adminSignupResponse.data.userId;
        adminToken = adminSigninResponse.data.token;
        
        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + `-user`,
            password,
            type: "user"
        })
        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + `-user`,
            password
        })
        userId = userSignupResponse.data.userId
        userToken = userSigninResponse.data.token
        // console.log("user token", userToken)
        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Defaul space",
            "defaultElements": [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
         mapId = mapResponse.data.id

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
            "mapId": mapId
        }, {headers: {
            "authorization": `Bearer ${userToken}`
        }})

        console.log(spaceResponse.status)
        spaceId = spaceResponse.data.spaceId
    }

    let ws1; // WebSocket connection to the server
    let ws2;
    let ws1Messages = [] // this gets populated with messages as they're coming from server
    let ws2Messages = []
    async function setupWs() {
        // WebSocket is connected to the server
        ws1 = new WebSocket(WS_URL)
        // set up an event listener to collect incoming messages in respective array
        ws1.onmessage = (event) => {
            console.log("got back data 1")
            console.log(event.data)
            ws1Messages.push(JSON.parse(event.data))
        }
        // create a new promise that resolves only when the WebSocket connection is open
        // we want to make sure that the WebSocket connection is established (onopen fires) before we start sending/receiving messages
        await new Promise(r => {
          ws1.onopen = r // onopen = resolve promise
        })

        ws2 = new WebSocket(WS_URL)
        ws2.onmessage = (event) => {
            console.log("got back data 2")
            console.log(event.data)
            ws2Messages.push(JSON.parse(event.data))
        }
        await new Promise(r => {
            ws2.onopen = r  
        })
    }

    function waitForAndPopLatestMessage(messageArray) {
        // WebSocket communication is asynchronous -> messages can arrive at any time.
        // So instead of directly accessing the message array, wait for a new message to arrive
        // if ws message array is empty, it waits for a message to come in, 
        // and when it does (if there are messages already in the array), it pops the latest one
        return new Promise(resolve => {
            if (messageArray.length > 0) {
                resolve(messageArray.shift()) // shift = pop
            } else {
                let interval = setInterval(() => { // setInterval = wait until a message arrives
                    if (messageArray.length > 0) {
                        resolve(messageArray.shift())
                        clearInterval(interval)
                    }
                }, 100)
            }
        })
    }
    
    beforeAll(async () => {
        await setupHTTP()
        await setupWs()
    })

    let userPositionX;
    let userPositionY;
    let adminPositionX;
    let adminPositionY;
    test("Get back an acknowledgement for joining the space", async () => {
        // in this test case, two ppl (admin and user) join the same space

        // 1. Client sends data to the WS1 server (e.g., a JSON payload describing a join action)
        ws1.send(JSON.stringify({
            "type": "join",
            "payload": {
                "spaceId": spaceId,
                "token": adminToken
            }
        }))
        // 2. WS1 server sends back a response = a message that confirms the admin joined successfully
        const message1 = await waitForAndPopLatestMessage(ws1Messages);
        
        // 3. same as above, but for the user with WS2 server
        ws2.send(JSON.stringify({
            "type": "join",
            "payload": {
                "spaceId": spaceId,
                "token": userToken
            }
        }))
        const message2 = await waitForAndPopLatestMessage(ws2Messages);

        expect(message1.type).toBe("space-joined")
        expect(message2.type).toBe("space-joined")
        expect(message1.payload.users.length).toBe(0) // first user to join the space -- no other users in the space so empty users array
        expect(message2.payload.users.length).toBe(1) // second user to join the space -- one user in the space already

        // 4. When the second user joins,  a "user-joined" message gets broadcasted to the first user
        const message3 = await waitForAndPopLatestMessage(ws1Messages);

        expect(message3.type).toBe("user-joined");
        expect(message3.payload.x).toBe(message2.payload.spawn.x);
        expect(message3.payload.y).toBe(message2.payload.spawn.y);
        expect(message3.payload.userId).toBe(userId);

        adminPositionX = message1.payload.spawn.x
        adminPositionY = message1.payload.spawn.y
        userPositionX = message2.payload.spawn.x
        userPositionY = message2.payload.spawn.y
    })

    test("User should not be able to move across the boundary of the wall", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 1000000,
                y: 10000
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected")
        expect(message.payload.x).toBe(adminPositionX)
        expect(message.payload.y).toBe(adminPositionY)
    })

    test("User should not be able to move two blocks at the same time", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminPositionX + 2, // invalid movement
                y: adminPositionY
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminPositionX);
        expect(message.payload.y).toBe(adminPositionY);
    })

    test("Correct movement should be broadcasted to the other sockets in the room", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminPositionX + 1, // valid movement
                y: adminPositionY,
                userId: adminId
            }
        }));

        const message = await waitForAndPopLatestMessage(ws2Messages);
        expect(message.type).toBe("movement");
        expect(message.payload.x).toBe(adminPositionX + 1);
        expect(message.payload.y).toBe(adminPositionY);
    })

    test("If a user leaves, the other user receives a leave event", async () => {
        ws1.close();
        const message = await waitForAndPopLatestMessage(ws2Messages);
        expect(message.type).toBe("user-left")
        expect(message.payload.userId).toBe(adminUserId)
    })
})