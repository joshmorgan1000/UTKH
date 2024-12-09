import numpy as np
import matplotlib.pyplot as plt
import sys
from scipy.optimize import minimize
from itertools import combinations

def generate_4d_tetrahedron(N=4):
    """
    Generate the vertices of a tetrahedron in 4D space.
    
    Returns:
        np.ndarray: Array of N points in 4D.
    """
    vertices_4d = np.zeros((N, 4))
    for i in range(N):
        for j in range(4):
            if j < i:
                vertices_4d[i, j] = -1 / (N - 1)  # Enforce equidistance
            else:
                vertices_4d[i, j] = np.sqrt(1 - np.sum(vertices_4d[i, :j] ** 2))
    vertices_4d /= np.linalg.norm(vertices_4d, axis=1)[:, np.newaxis]
    return vertices_4d

def project_to_3d_with_center(vertices_4d):
    """
    Project 4D vertices to 3D space while maintaining angular relationships
    with respect to the center.
    
    Parameters:
        vertices_4d (np.ndarray): Array of 4D points.
    
    Returns:
        np.ndarray: Array of 3D points.
    """
    N = vertices_4d.shape[0]
    r = 1.0  # Radius of the sphere
    theta_ideal = np.arccos(-1 / (N - 1))  # Ideal angular separation

    # Initial random points on the sphere
    points_3d = np.random.normal(size=(N, 3))
    points_3d /= np.linalg.norm(points_3d, axis=1)[:, np.newaxis]

    def energy(positions):
        positions = positions.reshape(N, 3)
        positions /= np.linalg.norm(positions, axis=1)[:, np.newaxis]  # Constrain to sphere
        E = 0

        # Enforce radial distances and angular separation
        for i in range(N):
            radial_dist = np.linalg.norm(positions[i])
            E += (radial_dist - r) ** 2  # Maintain constant radial distance

        for i, j in combinations(range(N), 2):
            cos_angle = np.dot(positions[i], positions[j]) / (r * r)
            angle = np.arccos(np.clip(cos_angle, -1, 1))
            E += (angle - theta_ideal) ** 2  # Maintain angular separation

        return E

    # Flatten initial positions for optimization
    initial_positions = points_3d.flatten()

    # Minimize energy
    result = minimize(energy, initial_positions, method="L-BFGS-B")
    optimized_positions = result.x.reshape(N, 3)

    # Normalize to ensure points lie on the sphere
    optimized_positions /= np.linalg.norm(optimized_positions, axis=1)[:, np.newaxis]
    return optimized_positions

def calculate_angles(points):
    """
    Calculate all angles between points with the center as the fulcrum.
    
    Parameters:
        points (np.ndarray): Array of points on the sphere.
    
    Returns:
        list: Sorted list of angles (in radians).
    """
    angles = []
    for p1, p2 in combinations(points, 2):
        cos_angle = np.dot(p1, p2) / (np.linalg.norm(p1) * np.linalg.norm(p2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))  # Clip for numerical stability
        angles.append(angle)
    angles.sort()
    return angles

def calculate_gravitational_forces(points):
    """
    Calculate the net gravitational force on each point.
    """
    G = 1.0  # Gravitational constant
    m = 1.0  # Mass of each point
    net_forces = np.zeros_like(points)

    for i, p1 in enumerate(points):
        for j, p2 in enumerate(points):
            if i != j:
                r_ij = p2 - p1
                distance = np.linalg.norm(r_ij)
                if distance > 0:
                    force = G * m**2 / distance**2 * (r_ij / distance)
                    net_forces[i] += force

    return net_forces

def verify_gravitational_symmetry(forces):
    """
    Verify if all gravitational forces point toward the center of the polyhedron.
    """
    deviations = []
    for force in forces:
        direction = force / np.linalg.norm(force)
        expected_direction = -force / np.linalg.norm(force)  # Should point to center
        deviation = np.linalg.norm(direction - expected_direction)
        deviations.append(deviation)
    return deviations

def plot_points(points, title="Points on a Sphere"):
    """Plot the points on a 3D sphere with labels."""
    fig = plt.figure(figsize=(8, 6))
    ax = fig.add_subplot(111, projection='3d')
    ax.scatter(points[:, 0], points[:, 1], points[:, 2], color='blue', s=100)

    # Add labels to each point
    for i, point in enumerate(points):
        ax.text(point[0], point[1], point[2], f'{i+1}', color='red', fontsize=10)
        ax.plot([0, point[0]], [0, point[1]], [0, point[2]], 'r--', alpha=0.5)

    ax.set_title(title)
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_zlabel("Z")
    plt.show()

def generate_hilbert_tetrahedron(N):
    """
    Generate a Hilbert tetrahedron with N vertices.
    
    Parameters:
        N (int): Number of vertices.
    
    Returns:
        np.ndarray: A list of N dimensional points on the Hilbert tetrahedron.
    """
    # We know the angle for each of the vertices is arccos(-1/3)
    radian = np.arccos(-1 / 3)
    # We know we'll always have at least 3 dimensions, so 1 and 2 are easy
    if N == 1:
        # Make an equalateral triangle with [0, 0, 0] as the center
        return np.array([[0, 1, 0],
                         [np.cos(radian), np.sin(radian), 0],
                         [np.cos(radian + radian), np.sin(radian + radian), 0]])
    if N == 2:
        # Make a tetrahedron with [0, 0, 0] as the center
        return np.array([[0, 1, 0],
                         [np.cos(radian), np.sin(radian), 0],
                         [np.cos(radian), np.sin(radian), 0],
                         [np.cos(radian + radian), np.sin(radian + radian), 0]])
    for i in range(1, N):
        # We know the angle for each of the vertices is arccos(-1/3)
        radian = np.arccos(-1 / 3)
        # We know we'll always have at least 3 dimensions, so 1 and 2 are easy
        if N == 1:
            # Make an equalateral triangle with [0, 0, 0] as the center
            return np.array([[0, 1, 0],
                            [np.cos(radian), np.sin(radian), 0],
                            [np.cos(radian ), 0, np.sin(radian)],
                            [0, np.cos(radian), np.sin(radian)]])
        if N == 2:
            # Make a tetrahedron with [0, 0, 0] as the center
            return np.array([[0, 1, 0],
                             [np.cos(radian), np.sin(radian), 0],
                             [np.cos(radian), 0, np.sin(radian)],
                             [0, np.cos(radian), np.sin(radian)]])
        
        # If we have more than 2 dimensions, we need to do some math
        points = np.zeros((N, N))
        points[0][0] = 1
        # Make sure the center of the Hilbert tetrahedron is at np.zeros(N), and the radius is 1.
        # Use the radian for angle calculations, and after the first 4 points are calculated in 3d space,
        # use the same method as the 3d tetrahedron to calculate the rest of the points in higher dimensions.
        for i in range(1, N):
            used_sin = False
            used_cos = False
            while not used_sin and not used_cos:
                if i < N - 4:
                    # Pick a number between i and N
                    p1 = np.random.randint(i, N - 1)
                    p2 = np.random.randint(i, N - 1)
                    if p1 == p2:
                        continue
                else:
                    p1 = i
                    p2 = i + 1
                    if p2 == N:
                        p2 = 0
                # If the points are not the same, use them
                used_sin = True
                used_cos = True
                negative = 1
                if (i % 2 == 0):
                    negative = -1
                points[i][p1] = np.sin(radian) * negative
                points[i][p2] = np.cos(radian) * negative
        print(f"Points for {N} dimensions:")
        print(points)
        # Check to make sure all the points are the same distance from the center
        distances_from_center = []
        for i in range(N):
            distances_from_center.append(np.linalg.norm(points[i] - np.zeros(N)))
        print(f"Distances from center for {N} dimensions:")
        print(distances_from_center)
        angles_from_each_point = []
        # Check to make sure all the angles are the same
        for i in range(N):
            for j in range(N):
                for k in range(N):
                    if i != j and i != k and j != k:
                        angle = np.arccos(np.dot(points[i] - points[j], points[i] - points[k]) / (np.linalg.norm(points[i] - points[j]) * np.linalg.norm(points[i] - points[k])))
                        angles_from_each_point.append(angle)
        
        angles_from_each_point.sort()
        print(f"Angles from each point for {N} dimensions:")
        print(angles_from_each_point)
        return points

if __name__ == "__main__":
    N = 2
    # Get the first command line argument and set it to N if it is given
    if len(sys.argv) > 1:
        N = int(sys.argv[1])
    if N < 1:
        print("Error: N must be at least 1 (which is just one point anyway, what's the deal?)")
        sys.exit(1)

    # This function will return the radian angles for each dimension of the hilbert tetrahedron
    points = generate_hilbert_tetrahedron(N)

    print(f"Generated Cartesian points for a Hilbert tetrahedron with {N} vertices:")
    print(points)
