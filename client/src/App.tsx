import React, { Suspense } from "react"
import PrivateRoute from "./PrivateRoute"
import FallbackLoading from "./Components/Loader/FallbackLoading"
import { Provider } from "react"
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"
import SignIn from "./Pages/SignIn"
import { privateRoutes, publicRoutes } from "./routes"
import store, { useAppSelector } from "./redux/store"

export interface UserData {
  _id: string
  email: string
  name: string
  userName: string
}

function App() {
  const userData: UserData = useAppSelector((state) => state.auth?.userData)

  return (
    <Router>
      <Routes>
        <Route element={<PrivateRoute userData={userData} />}>
          {privateRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        <Route
          path="/signin"
          element={userData ? <Navigate to="/" /> : <SignIn />}
        />
      </Routes>
    </Router>
  )
}

export default App
