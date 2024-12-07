from scipy.constants import G, c
from scipy.spatial.distance import pdist
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import argparse
import time

app = Flask(__name__)
CORS(app)


# Constants
mass_electron = 9.10938356e-31  # Electron mass in kg
mass_proton = 1.67262192369e-27  # Proton mass in kg
mass_neutron = 1.67492749804e-27  # Neutron mass in kg
photon_energy = 1.602176634e-19  # Energy of 1 eV in Joules
# Global variables for simulation parameters
MASS = 1.0  # Mass of the particles in the simulation
MAX_VELOCITY = None  # Maximum velocity allowed in the simulation
STANDALONE = True  # Whether to run the simulation as a standalone script
DEBUG_MESSAGES = True  # Whether to print debug messages
# Global variables for simulation state
objects = None
velocities = None


def energy_to_mass(energy):
    """
    Convert energy to mass using E = mc^2.
    :param energy: Energy in Joules
    :return: Mass in kilograms
    """
    return energy / c**2


def mass_to_energy(mass):
    """
    Convert mass to energy using E = mc^2.
    :param mass: Mass in kilograms
    :return: Energy in Joules
    """
    return mass * c**2


def mass_to_energy_including_velocity(mass, velocity):
    """
    Calculate the energy of a particle given its mass and velocity.
    :param mass: Mass of the particle in kilograms
    :param velocity: Velocity magnitude of the particle in m/s
    :return: Energy in Joules
    """
    return mass_to_energy(mass) + 0.5 * mass * velocity**2


def calculate_gravity_force(mass1, mass2, distance):
    """
    Calculate the gravitational force between two particles.
    :param mass1: Mass of the first particle in kilograms
    :param mass2: Mass of the second particle in kilograms
    :param distance: Distance between the particles in meters
    :return: Force magnitude in Newtons
    """
    return G * mass1 * mass2 / distance**2


def spherical_to_cartesian(theta, phi):
    """Convert spherical coordinates to Cartesian."""
    x = np.sin(theta) * np.cos(phi)
    y = np.sin(theta) * np.sin(phi)
    z = np.cos(theta)
    return np.array([x, y, z])

def potential_energy(coords, N):
    """Calculate the potential energy of N points on a sphere."""
    coords = coords.reshape((N, 2))
    positions = np.array([spherical_to_cartesian(theta, phi) for theta, phi in coords])
    energy = 0
    for i in range(N):
        for j in range(i + 1, N):
            # Inverse square law for repulsion
            r = np.linalg.norm(positions[i] - positions[j])
            energy += 1 / r
    return energy

def generate_points_on_sphere(N):
    """Find N points on a sphere using energy minimization."""
    # Initial guess: evenly spaced angles
    theta = np.arccos(np.linspace(1, -1, N))  # Latitude
    phi = np.linspace(0, 2 * np.pi, N, endpoint=False)  # Longitude
    initial_coords = np.stack([theta, phi], axis=1).flatten()

    # Minimize the potential energy
    result = minimize(
        potential_energy,
        initial_coords,
        args=(N,),
        method='L-BFGS-B',
        bounds=[(0, np.pi)] * N + [(0, 2 * np.pi)] * N,  # Bounds for theta and phi
    )

    # Convert the optimized spherical coordinates to Cartesian
    optimized_coords = result.x.reshape((N, 2))
    points = np.array([spherical_to_cartesian(theta, phi) for theta, phi in optimized_coords])
    return points
    

def calculate_initial_velocities(objects, inner_radius=5.0):
    """
    Calculate initial velocities for the particles.
    :param objects: Array of (x, y, z) coordinates of the particles
    :param inner_radius: Radius of the smaller sphere towards which particles will orbit
    :return: Array of (vx, vy, vz) velocity components for the particles
    """
    N = len(objects)
    velocities = np.zeros((N, 3))
    
    for i in range(N):
        # Calculate the direction vector from the particle to the center of the inner sphere
        r_particle = objects[i]
        r_center = np.array([0.0, 0.0, 0.0])
        r_direction = r_center - r_particle
        
        # Normalize the direction vector
        r_unit = r_direction / np.linalg.norm(r_direction)
        
        # Calculate the radial component of velocity (towards the inner sphere)
        radial_velocity_magnitude = 1.0  # You can adjust this magnitude as needed
        radial_velocity = radial_velocity_magnitude * r_unit
        
        # Calculate a tangential direction vector using cross product
        if i == 0:
            # For the first particle, use an arbitrary vector for cross product
            tangent_direction = np.cross(r_unit, np.array([1.0, 0.0, 0.0]))
        else:
            tangent_direction = np.cross(r_unit, objects[i-1] - r_particle)
        
        if np.linalg.norm(tangent_direction) == 0:
            # If the cross product is zero (collinear vectors), use a different vector
            tangent_direction = np.cross(r_unit, np.array([0.0, 1.0, 0.0]))
        
        tangent_direction /= np.linalg.norm(tangent_direction)
        
        # Calculate the tangential component of velocity
        tangential_velocity_magnitude = 1.0  # You can adjust this magnitude as needed
        tangential_velocity = tangential_velocity_magnitude * tangent_direction
        
        # Combine radial and tangential velocities
        total_velocity = radial_velocity + tangential_velocity
        velocities[i] = total_velocity
    
    return velocities


def initialize_simulation(N, sim_mass=1.0, max_accel=None):
    """
    Initialize the simulation with N particles equidistantly distributed on the surface of a sphere.
    :param N: Number of particles
    :param sim_mass: Mass of each particle in kilograms
    :param max_accel: Maximum acceleration allowed in the simulation
    :return: Initial positions and velocities of the particles
    """
    global objects, velocities, MASS, MAX_ACCELERATION

    MASS = sim_mass
    MAX_ACCELERATION = max_accel
    
    # Generate N equidistant points on the surface of a sphere with radius R
    R = 10.0  # Radius of the initial distribution
    objects = generate_equidistant_points(N)
    distances = pdist(objects)
    if DEBUG_MESSAGES:
        print(f"Initial positions: {objects}")
        print(f"Distances between particles: {distances}")

    # Calculate graviational pull between particles
    for i in range(N):
        for j in range(N):
            if i != j:
                distance = np.linalg.norm(objects[j] - objects[i])
                force = calculate_gravity_force(MASS, MASS, distance)
                if DEBUG_MESSAGES:
                    print(f"Force between {i} and {j}: {force}")
    
    # Calculate initial velocities directed towards a smaller sphere with an angular offset
    inner_radius = 5.0  # Radius of the smaller sphere
    velocities = calculate_initial_velocities(objects, inner_radius)
    
    return objects.tolist(), velocities.tolist()


def step_simulation():
    """
    Perform one step of the simulation by calculating the forces between particles and updating their positions and velocities.
    :return: New positions and velocities of the particles
    """
    global objects, velocities, MAX_ACCELERATION
    
    N = len(objects)
    acceleration = np.zeros((N, 3))
    
    for i in range(N):
        for j in range(N):
            if i != j:
                r_ij = objects[j] - objects[i]
                distance = np.linalg.norm(r_ij)
                if DEBUG_MESSAGES and i < j:
                    print(f"Distance between {i} and {j}: {distance}")
                # Avoid division by zero
                if distance > 0:
                    mass_including_momentum = MASS  # Assuming mass is constant for simplicity
                    force_magnitude = G * mass_including_momentum * mass_including_momentum / (distance ** 2)
                    acceleration[i] += force_magnitude * r_ij / distance
                else:
                    raise ValueError(f"Collision detected between objects {i} and {j}, halting simulation.")
    
    # Calculate the "new" acceleration vector for each object, and limit the acceleration to a maximum value
    if MAX_ACCELERATION is not None:
        acceleration_magnitude = np.linalg.norm(acceleration, axis=1)
        for i in range(N):
            if acceleration_magnitude[i] > MAX_ACCELERATION:
                acceleration[i] = (MAX_ACCELERATION / acceleration_magnitude[i]) * acceleration[i]

    # Update velocities and positions
    dt = 0.01  # Time step
    velocities += acceleration * dt
    objects += velocities * dt
    
    return objects.tolist(), velocities.tolist()


def organize_points():
    global objects

    forces = np.zeros((len(objects), 3))

    for i in range(len(objects)):
        # Add a strong force towards the center [0, 0, 0]
        forces[i] = -objects[i] * 0.001
    
    # Add a force that wants to keep them 2 pi r squared apart. If they are very close, force them to be at least 0.1 apart
    for i in range(len(objects)):
        for j in range(i + 1, len(objects)):
            r = np.linalg.norm(objects[i] - objects[j])
            if r < 0.1:
                forces[i] += (objects[i] - objects[j]) * 0.01
                forces[j] += (objects[j] - objects[i]) * 0.01
            else:
                forces[i] += (objects[i] - objects[j]) * 0.001 / r**2
                forces[j] += (objects[j] - objects[i]) * 0.001 / r**2

    # Update the positions based on the forces
    objects += forces
    
    # Make sure the points are all a distance of 1 from the origin
    for i in range(len(objects)):
        objects[i] /= np.linalg.norm(objects[i])
    
    return objects


@app.route('/sphere', methods=['GET'])
def sphere():
    points = organize_points()
    return jsonify(objects.tolist())


@app.route('/start_simulation', methods=['GET'])
def start_simulation():
    global MASS
    data = request.json
    N = data.get('N', 2)  # Default to 2 if not provided
    sim_mass = data.get('mass', 1.0)
    pos, vel = initialize_simulation(N, sim_mass)
    response = {
        'positions': pos,
        'velocities': vel
    }
    return jsonify(response)


@app.route('/step_simulation', methods=['GET'])
def simulate_step():
    if objects is None or velocities is None:
        return jsonify({'error': 'Simulation not initialized. Please start the simulation first.'}), 400
    try:
        if DEBUG_MESSAGES:
            print("Stepping simulation...")
        pos, vel = step_simulation()
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    response = {
        'positions': pos,
        'velocities': vel
    }
    return jsonify(response)


def run_standalone_simulation(N, sim_mass):
    global objects, velocities, STANDALONE
    STANDALONE = True
    print("Starting simulation...")
    initialize_simulation(N, sim_mass)
    print("Initial positions and velocities:")
    print(f"Positions: {objects}")
    print(f"Velocities: {velocities}")
    while True:
        try:
            pos, vel = step_simulation()
            print(f"Step: Positions: {pos}\n    Velocities: {vel}")
        except ValueError as e:
            print(f"Error in simulation step: {e}")
            break
        time.sleep(0.1)  # Output every 0.1 seconds


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="3D Gravity Simulation")
    parser.add_argument('--web', action='store_true', help="Run as a web service")
    parser.add_argument('-N', type=int, default=2, help="Number of objects (default: 2)")
    parser.add_argument('-MV', type=float, default=None, help="Maximum acceleration allowed in the simulation (default: None)")
    parser.add_argument('--mass', type=float, default=1.0, help="Mass of each object in kg (default: 1.0)")

    # Create 20 random 3d points, store them in objects
    for i in range(4):
        objects = np.random.rand(4, 3)
        print(objects)
        print(pdist(objects))

    args = parser.parse_args()

    if args.web:
        STANDALONE = False
        app.run(host='0.0.0.0', port=5010)
    else:
        # run_standalone_simulation(args.N, args.mass)
        for i in range(10):
            points = generate_points_on_sphere(i + 2)
            print(f"Points for N={i+2}: {points}")
            print(f"Distances for N={i+2}: {pdist(points)}")
