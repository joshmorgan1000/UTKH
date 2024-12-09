import numpy as np
import matplotlib.pyplot as plt
from itertools import combinations

def generate_points_with_repulsion(N, max_iter=1000, tolerance=1e-6):
    """
    Generate N points on the surface of a sphere using repulsion forces.
    """
    points = np.random.normal(size=(N, 3))
    points /= np.linalg.norm(points, axis=1)[:, np.newaxis]  # Normalize to unit sphere

    for _ in range(max_iter):
        forces = np.zeros_like(points)
        for i, p1 in enumerate(points):
            for j, p2 in enumerate(points):
                if i != j:
                    r = p1 - p2
                    distance = np.linalg.norm(r)
                    if distance > 0:
                        forces[i] += r / (distance**3)  # Repulsion force (inverse square law)

        points += 0.01 * forces  # Step size
        points /= np.linalg.norm(points, axis=1)[:, np.newaxis]  # Re-normalize to sphere

        max_force = np.max(np.linalg.norm(forces, axis=1))
        if max_force < tolerance:
            break

    return points

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

def plot_points_with_info(points, forces, deviations, title="Points on a Sphere"):
    """Plot points on a 3D sphere with compact gravitational info."""
    fig = plt.figure(figsize=(10, 5))
    
    # 3D scatter plot
    ax = fig.add_subplot(121, projection='3d')
    ax.scatter(points[:, 0], points[:, 1], points[:, 2], color='blue', s=20)

    for i, point in enumerate(points):
        ax.text(point[0], point[1], point[2], f'{i+1}', color='red', fontsize=8)
        ax.plot([0, point[0]], [0, point[1]], [0, point[2]], 'r--', alpha=0.8)

    ax.set_title(title)
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_zlabel("Z")

    # Info panel
    ax2 = fig.add_subplot(122)
    ax2.axis('off')
    info_text = "Points and Total Gravity Towards Center:\n\n"
    for i, (point, deviation) in enumerate(zip(points, deviations), start=1):
        coords = ', '.join([f"{x:.3f}" for x in point])
        info_text += f"Point {i}: [{coords}]\nGravitational Deviation: {deviation:.3f}\n\n"

    ax2.text(0.1, 0.5, info_text, fontsize=9, va='center')

    plt.style.use('seaborn-v0_8-dark-palette')
    plt.show()

if __name__ == "__main__":
    N = 47  # Number of points

    # Generate points on the sphere
    points = generate_points_with_repulsion(N)

    # Calculate gravitational forces
    gravitational_forces = calculate_gravitational_forces(points)

    # Verify gravitational symmetry
    deviations = verify_gravitational_symmetry(gravitational_forces)

    # Plot points and gravitational information
    plot_points_with_info(points, gravitational_forces, deviations, title=f"Polyhedron on a Sphere (N = {N})")

    # Calculate and display angles
    angles = []
    for p1, p2 in combinations(points, 2):
        cos_angle = np.dot(p1, p2) / (np.linalg.norm(p1) * np.linalg.norm(p2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        angles.append(angle)

    angles.sort()
    print(f"Angles between points (radians): {angles}")
    print(f"Angles between points (degrees): {[np.degrees(a) for a in angles]}")
